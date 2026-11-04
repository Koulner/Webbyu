<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
ini_set('display_errors', '0');
ini_set('log_errors', '0');
try {
    require dirname(__DIR__) . '/vendor/autoload.php';
    $config = \Webbyu\Inquiry\Configuration::load($argv[1] ?? '', getenv('WEBBYU_INQUIRY_CONFIG') ?: null);
    $state = new \Webbyu\Inquiry\StateStore($config->stateDirectory, $config->hmacKey, time());
    unset($state);
    echo "Inquiry cleanup OK\n";
} catch (\Webbyu\Inquiry\Busy) {
    exit(0); // An in-flight request already pruned state under the same lock.
} catch (Throwable) {
    fwrite(STDERR, "Inquiry cleanup unavailable; check private configuration and storage.\n");
    exit(1);
}
