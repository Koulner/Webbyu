<?php
declare(strict_types=1);

namespace Webbyu\Inquiry;

final class Input
{
    public const MAX_BYTES = 32768;
    public const KEYS = ['requestId', 'website', 'goal', 'extensions', 'projectType', 'timing', 'description', 'name', 'email', 'selectedPackage'];
    public const EXTENSIONS = ['photos', 'videos', 'cms', 'booking', 'seo', 'maps', 'wizard', '3d', 'unsure'];

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
        foreach (['requestId', 'website', 'goal', 'projectType', 'timing', 'description', 'name', 'email'] as $key) {
            if (!is_string($v[$key] ?? null)) $errors[] = $key;
        }
        if ($errors) return ['fields' => array_values(array_unique($errors))];
        if (!preg_match('/\A[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\z/D', $v['requestId'])) $errors[] = 'requestId';
        if ($v['website'] !== '') $errors[] = 'website';
        foreach (['goal' => ['presence', 'inquiries', 'bookings', 'sales'], 'projectType' => ['new', 'existing'], 'timing' => ['flexible', 'soon', 'later']] as $key => $choices) {
            if (!in_array($v[$key], $choices, true)) $errors[] = $key;
        }
        if (!in_array($v['selectedPackage'] ?? null, [null, 'start', 'business', 'complete', 'custom'], true)) $errors[] = 'selectedPackage';
        if (!is_array($v['extensions'] ?? null) || !array_is_list($v['extensions']) || count($v['extensions']) > count(self::EXTENSIONS)) {
            $errors[] = 'extensions';
        } else {
            foreach ($v['extensions'] as $extension) {
                if (!is_string($extension) || !in_array($extension, self::EXTENSIONS, true)) $errors[] = 'extensions';
            }
            if (!$errors && (count(array_unique($v['extensions'])) !== count($v['extensions']) || (in_array('unsure', $v['extensions'], true) && count($v['extensions']) > 1))) $errors[] = 'extensions';
        }
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
        return ['data' => $v];
    }
}
