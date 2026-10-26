<?php
declare(strict_types=1);
// This entry point contains no credentials. Private configuration is outside DOCUMENT_ROOT.
ini_set('display_errors', '0');
ini_set('log_errors', '0');
ignore_user_abort(true);
set_time_limit(60);
try {
    require dirname(__DIR__) . '/_inquiry/releases/__WEBBYU_RELEASE__/vendor/autoload.php';
    $body = file_get_contents('php://input', false, null, 0, \Webbyu\Inquiry\Input::MAX_BYTES + 1);
    $result = \Webbyu\Inquiry\Application::handle($_SERVER, $body === false ? '' : $body,
        fn() => \Webbyu\Inquiry\Configuration::load(dirname(__DIR__), getenv('WEBBYU_INQUIRY_CONFIG') ?: null));
    \Webbyu\Inquiry\Application::emit($result);
} catch (Throwable) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo '{"status":"temporary","outcome":"not_sent"}' . "\n";
}
