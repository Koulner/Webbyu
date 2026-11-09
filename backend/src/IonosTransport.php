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
        $mail->Body = $this->body($v);
        return $mail;
    }

    /** Lesbare Bezeichnungen der Antwortwerte. Werte sind bereits gegen Listen in Input geprüft. */
    private const LABELS = [
        'goal' => ['presence' => 'Mein Angebot verständlich zeigen', 'inquiries' => 'Passendere Anfragen erhalten', 'bookings' => 'Buchungen ermöglichen', 'sales' => 'Produkte verkaufen', 'media' => 'Fotos und Videos für das Unternehmen'],
        'projectType' => ['new' => 'Neue Website', 'existing' => 'Bestehende Website erneuern', 'media' => 'Nur Foto oder Video', 'advice' => 'Noch unklar, direkter Kontakt gewünscht'],
        'timing' => ['flexible' => 'Zeitlich flexibel', 'soon' => 'Möglichst bald', 'later' => 'In den nächsten Monaten'],
        'selectedPackage' => ['start' => 'Webbyu Start', 'business' => 'Webbyu Business', 'complete' => 'Webbyu Complete', 'custom' => 'Individuell klären'],
        'scope' => ['compact' => 'Kompakt (Onepager oder etwa 2 bis 5 Seiten)', 'extended' => 'Erweitert (mehrere Seitentypen oder etwa 6 bis 12 Seiten)', 'large' => 'Groß (mehr als etwa 12 Seiten)', 'unknown' => 'Noch unklar'],
        'texts' => ['ready' => 'Fertig', 'notes' => 'Stichpunkte vorhanden', 'missing' => 'Noch keine Texte', 'unknown' => 'Noch unklar'],
        'images' => ['ready' => 'Fertig', 'partly' => 'Teilweise vorhanden', 'missing' => 'Keine Bilder vorhanden', 'unknown' => 'Noch unklar'],
        'imageSource' => ['customer_later' => 'Besucher liefert später', 'photo_compact' => 'Fotos von Webbyu, kompakt', 'photo_standard' => 'Fotos von Webbyu, Standard', 'licensed' => 'Lizenzquellen', 'no_photos' => 'Ohne Fotos', 'open' => 'Noch offen'],
        'video' => ['none' => 'Kein Video', 'clip' => 'Kurzclip', 'unknown' => 'Noch unklar'],
        'zone' => ['region' => 'In der Region (Bad Oldesloe, Stormarn, Hamburg, Umland)', 'outside' => 'Außerhalb der Region', 'unknown' => 'Noch unklar'],
        'mediaChoice' => ['photo_compact' => 'Fotos kompakt', 'photo_standard' => 'Fotos Standard', 'clip' => 'Kurzclip', 'photo_clip' => 'Fotos und Kurzclip', 'unknown' => 'Noch unklar'],
        'mediaUse' => ['website' => 'Website', 'social' => 'Social Media', 'ads' => 'Eigene Werbung', 'third_party' => 'Weitergabe an Dritte'],
        'sites' => ['oneSite' => 'Ein Standort', 'multipleSites' => 'Mehrere Standorte'],
        'extensions' => ['wizard' => 'Auswahlhilfe', 'booking_embed' => 'Vorhandenen Buchungsdienst einbinden', 'booking_custom' => 'Eigene Buchungslösung', 'language' => 'Weitere Sprache', 'cms' => 'Inhalte selbst pflegen', 'integration' => 'Anbindung von Diensten oder Systemen', '3d' => 'Interaktives 3D', 'unsure' => 'Noch unsicher'],
    ];

    private static function label(string $group, string $value): string
    {
        return self::LABELS[$group][$value] ?? $value;
    }

    private static function labels(string $group, array $values): string
    {
        return $values ? implode(', ', array_map(static fn(string $value): string => self::label($group, $value), $values)) : 'keine';
    }

    private static function amount(int $min, int $max): string
    {
        $format = static fn(int $value): string => number_format($value, 0, ',', '.');
        return $min === $max ? $format($min) . ' €' : $format($min) . '–' . $format($max) . ' €';
    }

    /** Antworten, Preisorientierung (vom Besucher gesehen) und Kontaktdaten als reiner Text. */
    public function body(array $v): string
    {
        $block = static fn(string $label, string $value): string => $label . ":\n" . $value;
        $ids = array_column($v['shownLines'], 'id');
        $parts = ['Webbyu – unverbindliche Projektanfrage', 'Anfragekennung: ' . $v['requestId'], $block('Projekt', self::label('projectType', $v['projectType']))];
        if ($v['projectType'] !== 'advice') $parts[] = $block('Ziel', self::label('goal', $v['goal']));
        if ($v['projectType'] === 'media') {
            $parts[] = $block('Medienwunsch', self::label('mediaChoice', $v['mediaChoice'] ?? 'unknown'));
            $parts[] = $block('Verwendung', self::labels('mediaUse', $v['mediaUse']));
            $parts[] = $block('Ort', self::label('zone', $v['zone']));
            $parts[] = $block('Standorte', self::label('sites', $v['sites']));
            $parts[] = $block('Drohne', $v['drone'] ? 'gewünscht, wird gesondert geklärt' : 'nicht gewünscht');
        } elseif ($v['projectType'] !== 'advice') {
            $parts[] = $block('Umfang', self::label('scope', $v['scope']));
            $parts[] = $block('Funktionen', self::labels('extensions', $v['extensions']));
            $parts[] = $block('Texte', self::label('texts', $v['texts']));
            $parts[] = $block('Bilder', self::label('images', $v['images']));
            if ($v['images'] !== 'ready') $parts[] = $block('Bildquelle', self::label('imageSource', $v['imageSource'] ?? 'open'));
            $parts[] = $block('Video', self::label('video', $v['video']));
            if (in_array('travel_included', $ids, true) || in_array('travel_open', $ids, true)) $parts[] = $block('Ort', self::label('zone', $v['zone']));
            $parts[] = $block('Paketwunsch', $v['selectedPackage'] === null ? 'automatische Empfehlung' : self::label('selectedPackage', $v['selectedPackage']));
        }
        if ($v['shownLines'] !== []) $parts[] = $this->prices($v);
        $parts[] = $block('Start', self::label('timing', $v['timing']));
        $parts[] = $block('Projektbeschreibung', $v['description']);
        $parts[] = $block('Name', $v['name']);
        $parts[] = $block('E-Mail', $v['email']);
        return implode("\n\n", $parts) . "\n";
    }

    /** Dieselben drei Blöcke wie im Finder. Die Summe folgt der Regel des Finders: nur fixed und range, nie open. */
    private function prices(array $v): string
    {
        $creation = [];
        $open = [];
        $external = [];
        $min = 0;
        $max = 0;
        $amounts = 0;
        foreach ($v['shownLines'] as $line) {
            $label = Input::LINES[$line['id']];
            switch ($line['status']) {
                case 'included':
                    $creation[] = '- ' . $label . ': enthalten';
                    break;
                case 'fixed':
                case 'range':
                    $creation[] = '- ' . $label . ': ' . self::amount($line['min'], $line['max']);
                    $min += $line['min'];
                    $max += $line['max'];
                    $amounts++;
                    break;
                case 'open':
                    $open[] = '- ' . $label;
                    break;
                default:
                    $external[] = '- ' . $label . ': ' . ($line['max'] > 0 ? 'ca. ' . self::amount($line['min'], $line['max']) : 'je nach Anbieter');
            }
        }
        $openText = count($open) . (count($open) === 1 ? ' offene Position' : ' offene Positionen');
        if ($open === []) $sum = $amounts > 0 ? self::amount($min, $max) : 'keine einmaligen Kosten';
        elseif ($amounts > 0) $sum = self::amount($min, $max) . ' + ' . $openText . '. Kein vollständiger Gesamtpreis.';
        else $sum = 'Noch keine Summe möglich: ' . $openText . '. Kein vollständiger Gesamtpreis.';
        $text = [
            'Preisorientierung, vom Besucher gesehen und nicht geprüft (Katalog ' . $v['catalogVersion'] . ')',
            'Der Browser hat diese Positionen angezeigt. Der Server rechnet sie nicht neu, und sie binden nicht.',
            '',
            'Einmalige Erstellung:',
            ...($creation ?: ['- keine']),
            'Summe: ' . $sum,
            '',
            'Noch zu klären:',
            ...($open ?: ['- keine']),
        ];
        if ($external) array_push($text, '', 'Laufende Kosten bei Ihren Anbietern:', ...$external);
        if ($v['removedLines']) {
            $text[] = '';
            $text[] = 'Vom Besucher abgewählt: ' . implode(', ', array_map(static fn(string $id): string => Input::LINES[$id], $v['removedLines']));
        }
        return implode("\n", $text);
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
