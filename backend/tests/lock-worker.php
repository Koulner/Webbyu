<?php
declare(strict_types=1);
require dirname(__DIR__) . '/vendor/autoload.php';
try {
    $state = new \Webbyu\Inquiry\StateStore($argv[1], str_repeat('a', 64), 100000);
    echo 'open';
    // Optional: keep the lock for a few milliseconds, like a health check or the cleanup job.
    if (isset($argv[2])) { fflush(STDOUT); usleep((int)$argv[2] * 1000); }
} catch (\Webbyu\Inquiry\Busy) {
    echo 'busy';
}
