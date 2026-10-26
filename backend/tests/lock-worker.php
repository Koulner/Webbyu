<?php
declare(strict_types=1);
require dirname(__DIR__) . '/vendor/autoload.php';
try {
    $state = new \Webbyu\Inquiry\StateStore($argv[1], str_repeat('a', 64), 100000);
    echo 'open';
} catch (\Webbyu\Inquiry\Busy) {
    echo 'busy';
}
