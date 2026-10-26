<?php
declare(strict_types=1);
namespace Webbyu\Inquiry;

use PHPMailer\PHPMailer\SMTP;

/** Ambiguous DATA failures must never trigger an automatic second submission. */
class ObservedSMTP extends SMTP
{
    public bool $dataStarted = false;
    public bool $accepted = false;

    public function data($msg_data)
    {
        $this->dataStarted = true;
        $this->accepted = parent::data($msg_data);
        return $this->accepted;
    }
}
