<?php
declare(strict_types=1);
namespace Webbyu\Inquiry;

use PHPMailer\PHPMailer\PHPMailer;
use Throwable;

final class IonosTransport
{
    public function __construct(private readonly Configuration $config) {}

    public function message(array $v, ?ObservedSMTP $smtp = null): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $smtp ??= new ObservedSMTP();
        $smtp->Timelimit = 10;
        $mail->setSMTPInstance($smtp);
        $mail->Host = 'smtp.ionos.de';
        $mail->Port = 465;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->SMTPAutoTLS = false;
        $mail->SMTPAuth = true;
        $mail->Username = Configuration::ADDRESS;
        $mail->Password = $this->config->password;
        $mail->SMTPDebug = 0;
        $mail->Timeout = 10;
        $mail->SMTPOptions = ['ssl' => [
            'verify_peer' => true, 'verify_peer_name' => true, 'allow_self_signed' => false,
            'crypto_method' => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT,
        ]];
        $mail->CharSet = PHPMailer::CHARSET_UTF8;
        $mail->Encoding = PHPMailer::ENCODING_BASE64;
        $mail->setFrom(Configuration::ADDRESS, 'Webbyu Projektanfrage');
        $mail->Sender = Configuration::ADDRESS;
        $mail->addAddress(Configuration::ADDRESS);
        $mail->addReplyTo($v['email'], $v['name']);
        $mail->Subject = 'Webbyu Projektanfrage ' . $v['requestId'];
        $mail->MessageID = '<' . $v['requestId'] . '@webbyu.de>';
        $mail->Hostname = 'webbyu.de';
        $mail->Helo = 'webbyu.de';
        $mail->XMailer = '';
        $mail->isHTML(false);
        $labels = ['goal' => 'Ziel', 'extensions' => 'Erweiterungen', 'projectType' => 'Projekt', 'timing' => 'Start', 'selectedPackage' => 'Paketwunsch', 'description' => 'Projektbeschreibung', 'name' => 'Name', 'email' => 'E-Mail'];
        $body = ['Webbyu – unverbindliche Projektanfrage', 'Anfragekennung: ' . $v['requestId']];
        foreach ($labels as $key => $label) {
            $value = is_array($v[$key]) ? implode(', ', $v[$key]) : ($v[$key] ?? 'automatische Empfehlung');
            $body[] = $label . ":\n" . $value;
        }
        $mail->Body = implode("\n\n", $body) . "\n";
        return $mail;
    }

    public function __invoke(array $v): string
    {
        return $this->submit($v, new ObservedSMTP());
    }

    public function submit(array $v, ObservedSMTP $smtp): string
    {
        try {
            $mail = $this->message($v, $smtp);
            $mail->send();
            return $smtp->accepted ? 'accepted' : 'unknown';
        } catch (Throwable) {
            // Do not log exception text, SMTP replies, credentials or message contents.
            return $smtp->accepted ? 'accepted' : ($smtp->dataStarted ? 'unknown' : 'not_sent');
        } finally {
            $smtp->close();
        }
    }
}
