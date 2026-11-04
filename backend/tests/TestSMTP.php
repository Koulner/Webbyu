<?php
declare(strict_types=1);
use Webbyu\Inquiry\ObservedSMTP;

/** No sockets: exercises the real PHPMailer message/SMTP orchestration. Never deployed. */
final class TestSMTP extends ObservedSMTP
{
    private bool $live = false;
    public array $connection = [];
    public string $authUser = '';
    public array $recipients = [];
    public function __construct(private readonly string $scenario) {}
    public function connect($host, $port = null, $timeout = 30, $options = []) {
        $this->connection = [$host, $port, $options];
        return $this->live = $this->scenario !== 'connect_failure';
    }
    public function connected() { return $this->live; }
    public function hello($host = '') { return true; }
    public function authenticate($username, $password, $authtype = null, $OAuth = null) { $this->authUser = $username; return true; }
    public function mail($from) { return true; }
    public function recipient($address, $dsn = '') { $this->recipients[] = $address; return true; }
    public function data($msg_data) { $this->dataStarted = true; return $this->accepted = $this->scenario !== 'data_failure'; }
    public function quit($close_on_error = true) { if ($this->scenario === 'quit_failure') throw new RuntimeException('Connection lost after acceptance'); return true; }
    public function close() { $this->live = false; }
}
