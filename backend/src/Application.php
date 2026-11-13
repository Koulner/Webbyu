<?php
declare(strict_types=1);
namespace Webbyu\Inquiry;

use Throwable;

final class Application
{
    public const ORIGINS = ['https://webbyu.de', 'https://www.webbyu.de'];

    public static function response(int $http, array $body, array $headers = []): array
    {
        if (isset($body['retryAfter'])) $headers['Retry-After'] = (string)$body['retryAfter'];
        return ['http' => $http, 'body' => $body, 'headers' => $headers];
    }

    /** Transport is dependency injection for tests only; HTTP clients cannot select it. */
    public static function handle(array $server, string $raw, callable $configuration, ?callable $transport = null, ?int $now = null): array
    {
        $invalid = fn(int $http, array $fields = [], array $headers = []) => self::response($http, ['status' => 'invalid', 'fields' => $fields], $headers);
        if (($server['REQUEST_METHOD'] ?? '') !== 'POST') return $invalid(405, [], ['Allow' => 'POST']);
        $origin = $server['HTTP_ORIGIN'] ?? '';
        $host = $server['HTTP_HOST'] ?? '';
        if (!in_array($origin, self::ORIGINS, true) || $origin !== 'https://' . $host || (isset($server['HTTP_SEC_FETCH_SITE']) && $server['HTTP_SEC_FETCH_SITE'] !== 'same-origin')) return $invalid(403);
        if (!preg_match('/\Aapplication\/json(?:\s*;\s*charset=utf-8)?\z/iD', $server['CONTENT_TYPE'] ?? '')) return $invalid(415);
        if (isset($server['HTTP_CONTENT_ENCODING']) || strlen($raw) > Input::MAX_BYTES || (isset($server['CONTENT_LENGTH']) && (!ctype_digit((string)$server['CONTENT_LENGTH']) || (int)$server['CONTENT_LENGTH'] > Input::MAX_BYTES))) return $invalid(413);
        try { $value = json_decode($raw, false, 16, JSON_THROW_ON_ERROR); } catch (Throwable) { return $invalid(400); }
        $validated = Input::validate($value);
        if (isset($validated['fields'])) return $invalid(422, $validated['fields']);
        $v = $validated['data'];
        // From here until confirmed persistence of acceptance, failures may be ambiguous.
        $attempted = false;
        try {
            $config = $configuration();
            $ip = $server['REMOTE_ADDR'] ?? '';
            if (!filter_var($ip, FILTER_VALIDATE_IP)) throw new \RuntimeException('Peer unavailable');
            $state = new StateStore($config->stateDirectory, $config->hmacKey, $now ?? time());
            $fingerprint = $state->fingerprint($v);
            $existing = $state->existing($v['requestId'], $fingerprint);
            if ($existing) {
                if ($existing['status'] === 'conflict') return $invalid(422, ['requestId']);
                if ($existing['status'] === 'accepted') return self::response(200, ['status' => 'success', 'requestId' => $existing['requestId'], 'duplicate' => true]);
                return self::response(503, ['status' => 'temporary', 'outcome' => 'unknown']);
            }
            $retry = $state->rateLimit($ip, $v['email']);
            if ($retry) return self::response(429, ['status' => 'rate_limit', 'retryAfter' => $retry]);
            $state->record($v['requestId'], $fingerprint, 'pending');
            $attempted = true;
            $outcome = ($transport ?? new IonosTransport($config))($v);
            if ($outcome === 'accepted') {
                $state->record($v['requestId'], $fingerprint, 'accepted');
                return self::response(200, ['status' => 'success', 'requestId' => $v['requestId'], 'duplicate' => false]);
            }
            if ($outcome === 'not_sent') {
                $state->forget($v['requestId']);
                // Nothing left the server, so a manual retry must not run into the rate limit.
                $state->refund($ip, $v['email']);
            }
            return self::response(503, ['status' => 'temporary', 'outcome' => $outcome === 'not_sent' ? 'not_sent' : 'unknown']);
        } catch (Busy) {
            return self::response(503, ['status' => 'temporary', 'outcome' => 'not_sent', 'retryAfter' => 5]);
        } catch (Throwable) {
            return self::response(503, ['status' => 'temporary', 'outcome' => $attempted ? 'unknown' : 'not_sent']);
        }
    }

    public static function emit(array $result): void
    {
        http_response_code($result['http']);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('X-Webbyu-Inquiry: 1');
        foreach ($result['headers'] as $name => $value) header($name . ': ' . $value);
        echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE) . "\n";
    }
}
