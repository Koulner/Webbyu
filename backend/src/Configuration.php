<?php
declare(strict_types=1);

namespace Webbyu\Inquiry;

use RuntimeException;

final class Configuration
{
    public const ADDRESS = 'lukas.wagner@webbyu.de';

    public function __construct(
        public readonly string $password,
        public readonly string $hmacKey,
        public readonly string $stateDirectory,
    ) {}

    public static function outside(string $path, string $publicRoot): bool
    {
        $path = str_replace('\\', '/', $path);
        $root = rtrim(str_replace('\\', '/', $publicRoot), '/');
        if (PHP_OS_FAMILY === 'Windows') {
            $path = strtolower($path);
            $root = strtolower($root);
        }
        return $path !== $root && !str_starts_with($path, $root . '/');
    }

    public static function load(string $publicRoot, ?string $override = null): self
    {
        $root = realpath($publicRoot);
        if ($root === false || PHP_VERSION_ID < 80300 || !extension_loaded('openssl')) {
            throw new RuntimeException('Backend unavailable');
        }
        $path = realpath($override ?? dirname($root) . '/webbyu-private/inquiry.php');
        if ($path === false || !self::outside($path, $root) || !is_file($path)) {
            throw new RuntimeException('Private configuration unavailable');
        }
        // A mistakenly noisy private file must never write secrets into an HTTP response.
        ob_start();
        try { $values = (static fn(string $file) => require $file)($path); }
        finally { ob_end_clean(); }
        if (!is_array($values) || ($values['smtp_username'] ?? null) !== self::ADDRESS
            || !is_string($values['smtp_password'] ?? null) || $values['smtp_password'] === ''
            || !is_string($values['hmac_key'] ?? null) || !preg_match('/\A[a-f0-9]{64}\z/D', $values['hmac_key'])
            || !is_string($values['state_directory'] ?? null)) {
            throw new RuntimeException('Private configuration invalid');
        }
        $state = realpath($values['state_directory']);
        if ($state === false || !is_dir($state) || !self::outside($state, $root) || !is_writable($state)) {
            throw new RuntimeException('Private state unavailable');
        }
        if (PHP_OS_FAMILY !== 'Windows' && ((fileperms($path) & 0077) !== 0 || (fileperms($state) & 0077) !== 0)) {
            throw new RuntimeException('Private permissions invalid');
        }
        return new self($values['smtp_password'], $values['hmac_key'], $state);
    }
}
