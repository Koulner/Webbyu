<?php
declare(strict_types=1);

namespace Webbyu\Inquiry;

final class Input
{
    public const MAX_BYTES = 32768;
    public const KEYS = [
        'requestId', 'website', 'goal', 'extensions', 'projectType', 'timing', 'description', 'name', 'email', 'selectedPackage',
        'scope', 'texts', 'images', 'imageSource', 'video', 'zone', 'mediaChoice', 'mediaUse', 'sites', 'drone',
        'removedLines', 'catalogVersion', 'shownLines',
    ];
    public const EXTENSIONS = ['wizard', 'booking_embed', 'booking_custom', 'language', 'cms', 'integration', '3d', 'unsure'];
    public const MEDIA_USES = ['website', 'social', 'ads', 'third_party'];
    /** Positionen, die der Besucher abwählen darf. */
    public const REMOVABLE = ['migration', 'text_notes', 'text_interview'];
    public const LINE_STATUSES = ['included', 'fixed', 'range', 'open', 'external'];
    public const MAX_LINES = 30;
    public const MAX_AMOUNT = 100000;
    /**
     * Bekannte Positionen des Preiskatalogs (src/pricing-catalog.ts) mit Bezeichnung für die E-Mail.
     * Beträge stehen hier bewusst nicht: Der Preis kommt vom Browser und wird nur als „gesehen“ dargestellt.
     */
    public const LINES = [
        'base_start' => 'Grundlage Ihrer Website',
        'concept' => 'Konzept',
        'correction' => 'Korrektur',
        'golive' => 'Livegang',
        'handover' => 'Übergabe',
        'scope_extended' => 'Erweiterte Umsetzung',
        'scope_large' => 'Großer Umfang',
        'migration' => 'Bestehende Website übernehmen',
        'text_notes' => 'Texte aus Stichpunkten',
        'text_interview' => 'Texte aus einem Interview',
        'text_unknown' => 'Texte, Umfang noch offen',
        'photo_compact_site' => 'Fotos kompakt im Websiteprojekt',
        'photo_standard_site' => 'Fotos Standard im Websiteprojekt',
        'image_licensed' => 'Bildauswahl aus Lizenzquellen',
        'image_open' => 'Bildquelle noch offen',
        'license_cost' => 'Lizenzkosten der Bildquelle',
        'clip_addon' => 'Kurzclip beim Fototermin',
        'clip_solo' => 'Kurzclip',
        'clip_unknown' => 'Video, Umfang noch offen',
        'travel_included' => 'Anfahrt in der Region',
        'travel_open' => 'Anfahrt außerhalb der Region',
        'wizard' => 'Auswahlhilfe',
        'embed' => 'Vorhandenen Dienst einbinden',
        'language' => 'Weitere Sprache',
        'booking_custom' => 'Eigene Buchungslösung',
        'cms' => 'Inhalte selbst pflegen',
        'integration' => 'Anbindung von Diensten oder Systemen',
        '3d' => 'Interaktives 3D',
        'unsure' => 'Weitere Funktionen noch offen',
        'shop' => 'Shop',
        'hosting' => 'Domain und Hosting (monatlich, beim Anbieter des Besuchers)',
        'legal' => 'Rechtstexte',
        'photo_compact_solo' => 'Fotos kompakt',
        'photo_standard_solo' => 'Fotos Standard',
        'media_open' => 'Medienumfang noch offen',
        'drone' => 'Drohnenaufnahmen',
        'media_custom' => 'Mehrere Standorte oder Weitergabe an Dritte',
    ];

    /** Returns normalized data or a list of invalid field names. Never reflects user text. */
    public static function validate(mixed $input): array
    {
        if (!$input instanceof \stdClass || array_diff(array_keys(get_object_vars($input)), self::KEYS)) {
            return ['fields' => []];
        }
        $v = get_object_vars($input);
        $errors = [];
        foreach (self::KEYS as $key) {
            if (!array_key_exists($key, $v)) $errors[] = $key;
        }
        foreach (['requestId', 'website', 'goal', 'projectType', 'timing', 'description', 'name', 'email', 'scope', 'texts', 'images', 'video', 'zone', 'sites', 'catalogVersion'] as $key) {
            if (!is_string($v[$key] ?? null)) $errors[] = $key;
        }
        if (!is_bool($v['drone'] ?? null)) $errors[] = 'drone';
        if ($errors) return ['fields' => array_values(array_unique($errors))];
        if (!preg_match('/\A[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\z/D', $v['requestId'])) $errors[] = 'requestId';
        if ($v['website'] !== '') $errors[] = 'website';
        $choices = [
            'goal' => ['presence', 'inquiries', 'bookings', 'sales', 'media'],
            'projectType' => ['new', 'existing', 'media', 'advice'],
            'timing' => ['flexible', 'soon', 'later'],
            'scope' => ['compact', 'extended', 'large', 'unknown'],
            'texts' => ['ready', 'notes', 'missing', 'unknown'],
            'images' => ['ready', 'partly', 'missing', 'unknown'],
            'video' => ['none', 'clip', 'unknown'],
            'zone' => ['region', 'outside', 'unknown'],
            'sites' => ['oneSite', 'multipleSites'],
        ];
        foreach ($choices as $key => $allowed) {
            if (!in_array($v[$key], $allowed, true)) $errors[] = $key;
        }
        $nullable = [
            'selectedPackage' => ['start', 'business', 'complete', 'custom'],
            'imageSource' => ['customer_later', 'photo_compact', 'photo_standard', 'licensed', 'no_photos', 'open'],
            'mediaChoice' => ['photo_compact', 'photo_standard', 'clip', 'photo_clip', 'unknown'],
        ];
        foreach ($nullable as $key => $allowed) {
            if (!in_array($v[$key] ?? null, [null, ...$allowed], true)) $errors[] = $key;
        }
        if (!preg_match('/\A\d{4}-\d{2}-[a-z]\z/D', $v['catalogVersion'])) $errors[] = 'catalogVersion';
        foreach (['extensions' => self::EXTENSIONS, 'mediaUse' => self::MEDIA_USES, 'removedLines' => self::REMOVABLE] as $key => $allowed) {
            if (!self::uniqueList($v[$key] ?? null, $allowed)) $errors[] = $key;
        }
        if (!in_array('extensions', $errors, true) && in_array('unsure', $v['extensions'], true) && count($v['extensions']) > 1) $errors[] = 'extensions';
        $lines = self::shownLines($v['shownLines'] ?? null);
        if ($lines === null) $errors[] = 'shownLines';
        // No control characters in header-bound values. Description remains plain text.
        foreach (['name' => 120, 'email' => 254, 'description' => 5000] as $key => $max) {
            $pattern = $key === 'description' ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u' : '/[\x00-\x1F\x7F\x{2028}\x{2029}]/u';
            if (preg_match($pattern, $v[$key]) || preg_match_all('/./us', $v[$key]) > $max) $errors[] = $key;
            $v[$key] = trim(str_replace(["\r\n", "\r"], "\n", $v[$key]));
        }
        if ($v['name'] === '') $errors[] = 'name';
        // ASCII mailbox syntax (incl. plus tags); international names/descriptions are supported.
        if (!filter_var($v['email'], FILTER_VALIDATE_EMAIL) || !preg_match('/\A[\x21-\x7e]+\z/D', $v['email'])) $errors[] = 'email';
        if ($errors) return ['fields' => array_values(array_unique($errors))];
        sort($v['extensions']);
        sort($v['mediaUse']);
        sort($v['removedLines']);
        $v['shownLines'] = $lines;
        return ['data' => $v];
    }

    /** Unique list of known strings; at most as many entries as there are choices. */
    private static function uniqueList(mixed $value, array $allowed): bool
    {
        if (!is_array($value) || !array_is_list($value) || count($value) > count($allowed)) return false;
        foreach ($value as $item) {
            if (!is_string($item) || !in_array($item, $allowed, true)) return false;
        }
        return count(array_unique($value)) === count($value);
    }

    /** Positions as seen by the visitor: known id and status, whole-euro amounts. Returns null if invalid. */
    private static function shownLines(mixed $value): ?array
    {
        if (!is_array($value) || !array_is_list($value) || count($value) > self::MAX_LINES) return null;
        $lines = [];
        $seen = [];
        foreach ($value as $line) {
            if (!$line instanceof \stdClass) return null;
            $l = get_object_vars($line);
            if (count($l) !== 4 || array_diff(['id', 'status', 'min', 'max'], array_keys($l))) return null;
            if (!is_string($l['id']) || !isset(self::LINES[$l['id']]) || isset($seen[$l['id']])) return null;
            if (!is_string($l['status']) || !in_array($l['status'], self::LINE_STATUSES, true)) return null;
            foreach (['min', 'max'] as $bound) {
                if (!is_int($l[$bound]) || $l[$bound] < 0 || $l[$bound] > self::MAX_AMOUNT) return null;
            }
            if ($l['min'] > $l['max']) return null;
            $seen[$l['id']] = true;
            $lines[] = ['id' => $l['id'], 'status' => $l['status'], 'min' => $l['min'], 'max' => $l['max']];
        }
        return $lines;
    }
}
