<?php
declare(strict_types=1);

namespace Webbyu\Inquiry;

use RuntimeException;

/** One bounded file, one exclusive lock held through SMTP; no project contents on disk. */
final class StateStore
{
    public const DEDUP_SECONDS = 86400;
    public const RATE_SECONDS = 3600;
    /** Short holders (health check, cleanup) are waited out; an SMTP send still answers Busy. */
    public const LOCK_WAIT_MICROSECONDS = 1_000_000;
    private const MAX_BYTES = 2_000_000;
    private mixed $handle = null;
    private string $file;
    private array $state;

    public function __construct(string $directory, private readonly string $key, private readonly int $now)
    {
        clearstatcache();
        $this->file = $directory . '/inquiry-state.json';
        $lock = $directory . '/inquiry-state.lock';
        if (is_link($lock) || is_link($this->file) || is_link($this->file . '.tmp')) throw new RuntimeException('Unsafe state');
        $this->handle = fopen($lock, 'cb');
        if (!$this->handle) throw new RuntimeException('State unavailable');
        $waited = 0;
        while (!flock($this->handle, LOCK_EX | LOCK_NB)) {
            if ($waited >= self::LOCK_WAIT_MICROSECONDS) {
                fclose($this->handle);
                $this->handle = null;
                throw new Busy();
            }
            usleep(50_000);
            $waited += 50_000;
        }
        chmod($lock, 0600);
        $raw = is_file($this->file) ? file_get_contents($this->file, false, null, 0, self::MAX_BYTES + 1) : '';
        if ($raw === false || strlen($raw) > self::MAX_BYTES) throw new RuntimeException('State invalid');
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

    /** IPv6 counts per /64 network (one connection usually owns all of it); IPv4 and IPv4-mapped per address. */
    private static function peer(string $ip): string
    {
        $bin = inet_pton($ip);
        if ($bin === false || strlen($bin) !== 16) return $ip;
        if (str_starts_with($bin, str_repeat("\0", 10) . "\xff\xff")) return inet_ntop(substr($bin, 12));
        return inet_ntop(substr($bin, 0, 8) . str_repeat("\0", 8));
    }

    /** @return array<string, int> hashed counter key => limit per window */
    private function rateKeys(string $ip, string $email): array
    {
        return [$this->hash('ip:' . self::peer($ip)) => 5, $this->hash('email:' . strtolower($email)) => 3, 'global' => 30];
    }

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
        $keys = $this->rateKeys($ip, $email);
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

    /** Gives back the attempt counted by rateLimit() when nothing was sent. The lock guarantees it is the last entry. */
    public function refund(string $ip, string $email): void
    {
        foreach ($this->rateKeys($ip, $email) as $hash => $_) {
            $times = $this->state['rates'][$hash] ?? [];
            if ($times && end($times) === $this->now) array_pop($this->state['rates'][$hash]);
            if (isset($this->state['rates'][$hash]) && !$this->state['rates'][$hash]) unset($this->state['rates'][$hash]);
        }
        $this->save();
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

    /** Complete file or old file, never half of one: write a temporary copy, then rename over the original. */
    private function save(): void
    {
        $json = json_encode($this->state, JSON_THROW_ON_ERROR);
        $temporary = $this->file . '.tmp';
        $out = fopen($temporary, 'wb');
        if (!$out) throw new RuntimeException('State write failed');
        try {
            chmod($temporary, 0600);
            if (fwrite($out, $json) !== strlen($json) || !fflush($out) || !fsync($out)) throw new RuntimeException('State write failed');
        } finally {
            fclose($out);
        }
        if (!rename($temporary, $this->file)) throw new RuntimeException('State write failed');
    }

    public function __destruct()
    {
        if (is_resource($this->handle)) { flock($this->handle, LOCK_UN); fclose($this->handle); }
    }
}
