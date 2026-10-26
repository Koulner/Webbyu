<?php
declare(strict_types=1);
ini_set('display_errors', '0');
ini_set('log_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo '{"status":"invalid","fields":[]}' . "\n";
    exit;
}
try {
    require dirname(__DIR__) . '/_inquiry/releases/__WEBBYU_RELEASE__/vendor/autoload.php';
    if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) throw new RuntimeException('Dependency unavailable');
    $config = \Webbyu\Inquiry\Configuration::load(dirname(__DIR__), getenv('WEBBYU_INQUIRY_CONFIG') ?: null);
    $state = new \Webbyu\Inquiry\StateStore($config->stateDirectory, $config->hmacKey, time());
    unset($state);
    echo '{"status":"ready","execution":"php","contract":1,"release":"__WEBBYU_RELEASE__"}' . "\n";
} catch (\Webbyu\Inquiry\Busy) {
    http_response_code(503);
    echo '{"status":"busy","execution":"php","contract":1,"release":"__WEBBYU_RELEASE__"}' . "\n";
} catch (Throwable) {
    http_response_code(503);
    echo '{"status":"unavailable","execution":"php","contract":1,"release":"__WEBBYU_RELEASE__"}' . "\n";
}
