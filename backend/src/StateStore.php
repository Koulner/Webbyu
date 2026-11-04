<?php
declare(strict_types=1);

namespace Webbyu\Inquiry;

use RuntimeException;

/** One bounded file, one exclusive lock held through SMTP; no project contents on disk. */
final class StateStore
{
    public const DEDUP_SECONDS = 86400;
    public const RATE_SECONDS = 3600;
    private mixed $handle = null;
    private array $state;

    public function __construct(string $directory, private readonly string $key, private readonly int $now)
    {
        $file = $directory . '/inquiry-state.json';
        if (is_link($file)) throw new RuntimeException('Unsafe state');
        $this->handle = fopen($file, 'c+b');
        if (!$this->handle) throw new RuntimeException('State unavailable');
        if (!flock($this->handle, LOCK_EX | LOCK_NB)) {
            fclose($this->handle);
            $this->handle = null;
            throw new Busy();
        }
        chmod($file, 0600);
        $stat = fstat($this->handle);
        if (!$stat || $stat['size'] > 2_000_000) throw new RuntimeException('State invalid');
        $raw = stream_get_contents($this->handle);
        $this->state = $raw === '' ? ['rates' => [], 'requests' => []] : json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
        if (!isset($this->state['rates'], $this->state['requests']) || !is_array($this->state['rates']) || !is_array($this->state['requests'])) throw new RuntimeException('State invalid');
        foreach ($this->state['rates'] as $hash => $times) {
            $this->state['rates'][$hash] = array_values(array_filter($times, fn($t) => $t > $now - self::RATE_SECONDS));
            if (!$this->state['rates'][$hash]) unset($this->state['rates'][$hash]);
        }
        foreach ($this->state['requests'] as $hash => $record) {
            if ($record['expires'] <= $now) unset($this->state['requests'][$hash]);
        }
        $this->save();
    }

    private function hash(string $value): string { return hash_hmac('sha256', $value, $this->key); }

    public function fingerprint(array $v): string
    {
        unset($v['requestId'], $v['website']);
        $v['email'] = strtolower($v['email']);
        ksort($v);
        return $this->hash('content:' . json_encode($v, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));
    }

    public function existing(string $id, string $fingerprint): ?array
    {
        $match = $this->state['requests'][$this->hash('id:' . $id)] ?? null;
        if ($match && $match['fingerprint'] !== $fingerprint) return ['status' => 'conflict'];
        if ($match) return $match;
        foreach ($this->state['requests'] as $record) {
            if (hash_equals($record['fingerprint'], $fingerprint)) return $record;
        }
        return null;
    }

    public function rateLimit(string $ip, string $email): int
    {
        $keys = [$this->hash('ip:' . $ip) => 5, $this->hash('email:' . strtolower($email)) => 3, 'global' => 30];
        $retry = 0;
        foreach ($keys as $hash => $limit) {
            $times = $this->state['rates'][$hash] ?? [];
            if (count($times) >= $limit) $retry = max($retry, $times[0] + self::RATE_SECONDS - $this->now);
        }
        if ($retry > 0) return $retry;
        foreach ($keys as $hash => $_) $this->state['rates'][$hash][] = $this->now;
        $this->save();
        return 0;
    }

    public function record(string $id, string $fingerprint, string $status): void
    {
        $this->state['requests'][$this->hash('id:' . $id)] = [
            'requestId' => $id, 'fingerprint' => $fingerprint, 'status' => $status,
            'expires' => $this->now + self::DEDUP_SECONDS,
        ];
        $this->save();
    }

    public function forget(string $id): void
    {
        unset($this->state['requests'][$this->hash('id:' . $id)]);
        $this->save();
    }

    private function save(): void
    {
        $json = json_encode($this->state, JSON_THROW_ON_ERROR);
        rewind($this->handle);
        if (fwrite($this->handle, $json) !== strlen($json) || !ftruncate($this->handle, strlen($json)) || !fflush($this->handle) || !fsync($this->handle)) throw new RuntimeException('State write failed');
    }

    public function __destruct()
    {
        if (is_resource($this->handle)) { flock($this->handle, LOCK_UN); fclose($this->handle); }
    }
}
