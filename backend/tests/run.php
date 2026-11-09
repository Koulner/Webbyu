<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use Webbyu\Inquiry\{Application, Busy, Configuration, Input, IonosTransport, ObservedSMTP, StateStore};

error_reporting(E_ALL);
set_error_handler(static function (int $code, string $message): never { throw new ErrorException($message, 0, $code); });
$tests = 0;
function check(bool $condition, string $message): void {
    global $tests;
    if (!$condition) throw new RuntimeException($message);
    $tests++;
}
function line(string $id, string $status, int $min = 0, int $max = 0): array {
    return ['id' => $id, 'status' => $status, 'min' => $min, 'max' => $max];
}
function payload(array $patch = []): array {
    return array_replace([
        'requestId' => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'website' => '', 'goal' => 'inquiries',
        'extensions' => ['cms', 'wizard'], 'projectType' => 'new', 'timing' => 'flexible',
        'description' => "Über uns: <script>alert('x')</script> & Foto\nZweite Zeile", 'name' => 'Jörg & Söhne',
        'email' => 'visitor+tag@example.org', 'selectedPackage' => null,
        'scope' => 'extended', 'texts' => 'notes', 'images' => 'partly', 'imageSource' => 'photo_standard', 'video' => 'clip', 'zone' => 'region',
        'mediaChoice' => null, 'mediaUse' => [], 'sites' => 'oneSite', 'drone' => false,
        'removedLines' => ['text_notes'], 'catalogVersion' => '2026-11-a',
        'shownLines' => [
            line('base_start', 'fixed', 990, 990), line('concept', 'included'), line('scope_extended', 'fixed', 750, 750),
            line('photo_standard_site', 'fixed', 520, 520), line('clip_addon', 'open'), line('travel_included', 'included'),
            line('wizard', 'fixed', 490, 490), line('cms', 'open'), line('hosting', 'external', 5, 15), line('legal', 'external'),
        ],
    ], $patch);
}
function mediaPayload(array $patch = []): array {
    return payload(array_replace([
        'goal' => 'media', 'projectType' => 'media', 'extensions' => [], 'scope' => 'unknown', 'texts' => 'unknown', 'images' => 'unknown',
        'imageSource' => null, 'video' => 'unknown', 'mediaChoice' => 'photo_clip', 'mediaUse' => ['website', 'third_party'], 'sites' => 'multipleSites',
        'drone' => true, 'removedLines' => [], 'zone' => 'outside',
        'shownLines' => [line('photo_standard_solo', 'fixed', 590, 590), line('clip_addon', 'open'), line('travel_open', 'open'), line('drone', 'open'), line('media_custom', 'open')],
    ], $patch));
}
/** Wie vom Server gelesen: JSON-Objekte werden zu stdClass, Listen zu Arrays. */
function asInput(array $payload): object {
    return json_decode(json_encode($payload, JSON_THROW_ON_ERROR), false, 16, JSON_THROW_ON_ERROR);
}
function server(array $patch = []): array {
    return array_replace(['REQUEST_METHOD' => 'POST', 'HTTP_HOST' => 'webbyu.de', 'HTTP_ORIGIN' => 'https://webbyu.de',
        'CONTENT_TYPE' => 'application/json; charset=utf-8', 'HTTP_SEC_FETCH_SITE' => 'same-origin', 'REMOTE_ADDR' => '192.0.2.1'], $patch);
}
$temporary = sys_get_temp_dir() . '/webbyu-php-' . bin2hex(random_bytes(8));
mkdir($temporary, 0700);
function config(string $suffix = ''): Configuration {
    global $temporary;
    $dir = $temporary . '/' . ($suffix ?: bin2hex(random_bytes(5)));
    mkdir($dir, 0700);
    return new Configuration('test-only-password', str_repeat('a', 64), $dir);
}
function invoke(Configuration $config, array $patch = [], ?callable $transport = null, int $now = 100000): array {
    return Application::handle(server(), json_encode(payload($patch), JSON_THROW_ON_ERROR), fn() => $config, $transport ?? fn() => 'accepted', $now);
}
function removeTree(string $path): void {
    foreach (new FilesystemIterator($path) as $entry) {
        if ($entry->isDir()) removeTree($entry->getPathname()); else unlink($entry->getPathname());
    }
    rmdir($path);
}

try {
    foreach ([['REQUEST_METHOD' => 'GET'], ['REQUEST_METHOD' => 'OPTIONS'], ['HTTP_ORIGIN' => 'https://evil.example'], ['HTTP_ORIGIN' => 'null'], ['HTTP_ORIGIN' => ''], ['HTTP_HOST' => 'evil.example'], ['HTTP_SEC_FETCH_SITE' => 'cross-site'], ['CONTENT_TYPE' => 'text/plain'], ['CONTENT_LENGTH' => '32769'], ['HTTP_CONTENT_ENCODING' => 'gzip']] as $patch) {
        $r = Application::handle(server($patch), '{}', fn() => throw new RuntimeException('Must not load configuration'));
        check($r['http'] >= 400 && $r['http'] < 500, 'HTTP rejection before configuration');
    }
    foreach (['{', 'null', '[]', '"text"', '{}', str_repeat('x', Input::MAX_BYTES + 1)] as $raw) {
        check(Application::handle(server(), $raw, fn() => null)['body']['status'] === 'invalid', 'Malformed/oversized payload');
    }
    foreach ([['name' => ' '], ['name' => "Name\r\nBcc: bad@example.org"], ['email' => "victim@example.org\r\nBcc: bad@example.org"], ['email' => 'bad'], ['email' => 'ü@example.org'], ['website' => 'bot'], ['to' => 'bad@example.org'], ['from' => 'bad@example.org'], ['headers' => []], ['attachments' => []], ['name' => str_repeat('a', 121)], ['description' => str_repeat('🙂', 5001)], ['description' => "bad\0text"], ['extensions' => ['cms', 'cms']], ['extensions' => ['unsure', 'cms']], ['extensions' => ['bad']], ['extensions' => ['photos']], ['extensions' => ['seo']], ['extensions' => ['booking']], ['extensions' => [['bad']]], ['extensions' => (object)['a' => 'cms']], ['selectedPackage' => 'free'], ['goal' => 'bad'], ['projectType' => 'bad'], ['timing' => 'bad'], ['requestId' => 'injected'], ['requestId' => 'aaaaaaaa-aaaa-1aaa-8aaa-aaaaaaaaaaaa'],
        ['scope' => 'huge'], ['texts' => 'bad'], ['images' => 'bad'], ['imageSource' => 'stock'], ['video' => 'film'], ['zone' => 'world'], ['mediaChoice' => 'drone'], ['mediaUse' => ['bad']], ['mediaUse' => ['website', 'website']], ['mediaUse' => 'website'],
        ['sites' => 'many'], ['drone' => 'yes'], ['drone' => 1], ['removedLines' => ['base_start']], ['removedLines' => ['migration', 'migration']], ['removedLines' => ['bad']], ['catalogVersion' => 'latest'], ['catalogVersion' => '2026-11-A'], ['catalogVersion' => "2026-11-a\n"],
        ['shownLines' => 'x'], ['shownLines' => (object)['a' => 1]], ['shownLines' => ['base_start']], ['shownLines' => [line('unknown_line', 'fixed', 1, 1)]], ['shownLines' => [line('base_start', 'free', 0, 0)]],
        ['shownLines' => [line('base_start', 'fixed', 990, 990), line('base_start', 'fixed', 990, 990)]], ['shownLines' => [line('base_start', 'fixed', -1, 5)]], ['shownLines' => [line('base_start', 'fixed', 9, 5)]], ['shownLines' => [line('base_start', 'fixed', 100001, 100001)]],
        ['shownLines' => [['id' => 'base_start', 'status' => 'fixed', 'min' => 1.5, 'max' => 2]]], ['shownLines' => [['id' => 'base_start', 'status' => 'fixed', 'min' => '990', 'max' => 990]]],
        ['shownLines' => [['id' => 'base_start', 'status' => 'fixed', 'min' => 990, 'max' => 990, 'price' => 1]]], ['shownLines' => [['id' => 'base_start', 'status' => 'fixed', 'min' => 990]]],
        ['shownLines' => array_map(fn(int $i) => line(array_keys(Input::LINES)[$i], 'open'), range(0, 30))]] as $patch) {
        check(isset(Input::validate(json_decode(json_encode(payload($patch))))['fields']), 'Invalid fields rejected');
    }
    foreach (Input::KEYS as $field) {
        $v = payload(); unset($v[$field]);
        check(in_array($field, Input::validate(asInput($v))['fields'], true), 'Required contract field');
    }
    check(isset(Input::validate(asInput(payload(['description' => str_repeat('🙂', 5000)])))['data']), 'Unicode character limit');
    check(isset(Input::validate(asInput(payload(['description' => ''])))['data']), 'Description optional');
    check(isset(Input::validate(asInput(mediaPayload()))['data']), 'Media route accepted');
    check(isset(Input::validate(asInput(payload(['projectType' => 'advice', 'shownLines' => [], 'extensions' => [], 'removedLines' => []])))['data']), 'Advice route without positions accepted');
    check(isset(Input::validate(asInput(payload(['images' => 'ready', 'imageSource' => null])))['data']), 'Image source optional when images are ready');
    check(isset(Input::validate(asInput(payload(['shownLines' => array_map(fn(int $i) => line(array_keys(Input::LINES)[$i], 'open'), range(0, 29))])))['data']), 'Thirty positions allowed');
    $sorted = Input::validate(asInput(payload(['removedLines' => ['text_notes', 'migration'], 'extensions' => ['wizard', 'cms'], 'mediaUse' => ['website', 'ads']])))['data'];
    check($sorted['removedLines'] === ['migration', 'text_notes'] && $sorted['extensions'] === ['cms', 'wizard'] && $sorted['mediaUse'] === ['ads', 'website'], 'Lists are sorted for stable duplicate detection');
    check($sorted['shownLines'][0] === ['id' => 'base_start', 'status' => 'fixed', 'min' => 990, 'max' => 990], 'Positions are normalized to plain arrays');
    $raw = json_encode(payload(), JSON_THROW_ON_ERROR);
    $r = Application::handle(server(), $raw, fn() => throw new RuntimeException('Private secret must not leak'));
    check($r['http'] === 503 && $r['body'] === ['status' => 'temporary', 'outcome' => 'not_sent'], 'Missing config honest and redacted');

    $c = config(); $calls = 0;
    $send = function () use (&$calls) { $calls++; return 'accepted'; };
    $r = invoke($c, [], $send);
    check($r['http'] === 200 && $r['body']['duplicate'] === false, 'Success after acceptance');
    check(invoke($c, [], $send)['body']['duplicate'] === true && $calls === 1, 'Doppelklick is idempotent');
    $r = invoke($c, ['requestId' => 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'extensions' => ['wizard', 'cms']], $send);
    check($r['body']['duplicate'] === true && $calls === 1 && $r['body']['requestId'] === payload()['requestId'], 'Same content with new id reuses original acceptance');
    check(invoke($c, ['description' => 'changed'], $send)['body']['fields'] === ['requestId'] && $calls === 1, 'ID cannot be reused for changed data');
    $disk = file_get_contents($c->stateDirectory . '/inquiry-state.json');
    foreach (['visitor', 'example.org', 'Jörg', '192.0.2.1', 'Über uns', 'test-only-password'] as $private) check(!str_contains($disk, $private), 'No personal contents in protection store');
    check(invoke($c, [], $send, 100000 + StateStore::DEDUP_SECONDS)['body']['duplicate'] === false && $calls === 2, 'Dedup expiry');
    $changedLines = payload()['shownLines'];
    $changedLines[0] = line('base_start', 'fixed', 1190, 1190);
    foreach ([['shownLines' => $changedLines], ['catalogVersion' => '2026-12-a'], ['removedLines' => ['migration']], ['scope' => 'compact'], ['imageSource' => 'licensed'], ['texts' => 'missing'], ['images' => 'unknown'], ['video' => 'none'], ['zone' => 'outside'], ['mediaChoice' => 'clip'], ['mediaUse' => ['social']], ['sites' => 'multipleSites'], ['drone' => true]] as $variant) {
        $fresh = config();
        $count = 0;
        $counter = function () use (&$count) { $count++; return 'accepted'; };
        invoke($fresh, [], $counter);
        $r = invoke($fresh, ['requestId' => 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'] + $variant, $counter);
        check($r['body']['duplicate'] === false && $count === 2, 'Every new field belongs to the duplicate fingerprint');
    }

    foreach (['unknown', 'throw', 'not_sent'] as $outcome) {
        $c = config(); $calls = 0;
        $send = function () use ($outcome, &$calls) { $calls++; if ($outcome === 'throw') throw new RuntimeException('SMTP secret'); return $outcome; };
        $r = invoke($c, [], $send);
        check($r['http'] === 503 && $r['body']['outcome'] === ($outcome === 'not_sent' ? 'not_sent' : 'unknown'), 'SMTP failure classification');
        invoke($c, [], $send);
        check($calls === ($outcome === 'not_sent' ? 2 : 1), 'Unknown outcome prevents retry, definite failure permits manual retry');
    }
    $c = config();
    $s = new StateStore($c->stateDirectory, $c->hmacKey, 100000);
    $v = Input::validate(asInput(payload()))['data'];
    $s->record($v['requestId'], $s->fingerprint($v), 'pending');
    check(invoke($c)['body']['retryAfter'] === 5, 'Concurrent request fails closed while lock held');
    $worker = static function (string $directory): string {
        $process = proc_open([PHP_BINARY, __DIR__ . '/lock-worker.php', $directory], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        if (!is_resource($process)) throw new RuntimeException('Cannot start independent lock worker');
        fclose($pipes[0]);
        $output = stream_get_contents($pipes[1]); $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        if (proc_close($process) !== 0 || $error !== '') throw new RuntimeException('Independent lock worker failed');
        return $output;
    };
    check($worker($c->stateDirectory) === 'busy', 'Independent PHP process cannot acquire active SMTP lock');
    unset($s);
    check($worker($c->stateDirectory) === 'open', 'Independent PHP process acquires released lock');
    check(invoke($c)['body']['outcome'] === 'unknown', 'Crash after reservation must not resend');

    $broken = config();
    file_put_contents($broken->stateDirectory . '/inquiry-state.json', '{partial');
    check(invoke($broken, [], fn() => throw new RuntimeException('Must not send with corrupt state'))['http'] === 503, 'Corrupt state fails closed');

    foreach (['email' => 3, 'ip' => 5, 'global' => 30] as $limitType => $limit) {
        $c = config();
        for ($i = 0; $i <= $limit; $i++) {
            $v = payload(['requestId' => sprintf('%08x-aaaa-4aaa-8aaa-aaaaaaaaaaaa', $i), 'description' => (string)$i,
                'email' => $limitType === 'email' ? 'same@example.org' : "person$i@example.org"]);
            $peer = $limitType === 'ip' ? '192.0.2.1' : '192.0.2.' . ($i + 1);
            $r = Application::handle(server(['REMOTE_ADDR' => $peer, 'HTTP_X_FORWARDED_FOR' => '198.51.100.1']), json_encode($v), fn() => $c, fn() => 'accepted', 100000);
            check($r['http'] === ($i < $limit ? 200 : 429), 'Rate limit ' . $limitType);
        }
        check($r['body']['retryAfter'] === 3600 && $r['headers']['Retry-After'] === '3600', 'Rate wait contract');
        check(invoke($c, ['requestId' => 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'description' => 'after expiry'], null, 103600)['http'] === 200, 'Rate window expires');
    }

    $c = config();
    $message = (new IonosTransport($c))->message(Input::validate(asInput(payload()))['data']);
    check($message->Host === 'smtp.ionos.de' && $message->Port === 465 && $message->SMTPSecure === 'ssl' && $message->SMTPAuth && !$message->SMTPAutoTLS, 'Authenticated implicit TLS without fallback');
    check($message->SMTPOptions['ssl']['verify_peer'] && $message->SMTPOptions['ssl']['verify_peer_name'] && !$message->SMTPOptions['ssl']['allow_self_signed'], 'Certificate validation required');
    check($message->From === Configuration::ADDRESS && $message->Sender === Configuration::ADDRESS && $message->getToAddresses() === [[Configuration::ADDRESS, '']], 'Fixed sender/envelope/recipient');
    check($message->getCcAddresses() === [] && $message->getBccAddresses() === [] && $message->getAttachments() === [], 'No extra recipients or attachments');
    check($message->getReplyToAddresses() === [[payload()['email'], payload()['name']]], 'Visitor only as Reply-To');
    check($message->preSend(), 'PHPMailer generates real MIME');
    $mime = $message->getSentMIMEMessage();
    check(str_contains($mime, 'Content-Type: text/plain; charset=utf-8') && !str_contains($mime, 'text/html'), 'HTML treated as literal plain text');
    check(str_contains($mime, 'Content-Transfer-Encoding: base64') && str_contains($mime, payload()['requestId']), 'MIME encoding and correlation');
    check($message->SMTPDebug === 0 && $message->getSMTPInstance()->Timelimit === 10, 'No SMTP logging and bounded waits');
    $transport = new IonosTransport($c);
    $body = $transport->body(Input::validate(asInput(payload()))['data']);
    foreach ([
        "Funktionen:\nInhalte selbst pflegen, Auswahlhilfe", "Paketwunsch:\nautomatische Empfehlung", "Bildquelle:\nFotos von Webbyu, Standard", "Ort:\nIn der Region",
        'Preisorientierung, vom Besucher gesehen und nicht geprüft (Katalog 2026-11-a)', 'Der Server rechnet sie nicht neu, und sie binden nicht.',
        "Einmalige Erstellung:\n- Grundlage Ihrer Website: 990 €", '- Konzept: enthalten', '- Erweiterte Umsetzung: 750 €', 'Summe: 2.750 € + 2 offene Positionen. Kein vollständiger Gesamtpreis.',
        "Noch zu klären:\n- Kurzclip beim Fototermin\n- Inhalte selbst pflegen", "Laufende Kosten bei Ihren Anbietern:\n- Domain und Hosting (monatlich, beim Anbieter des Besuchers): ca. 5–15 €", '- Rechtstexte: je nach Anbieter',
        'Vom Besucher abgewählt: Texte aus Stichpunkten',
    ] as $expected) check(str_contains($body, $expected), 'Inquiry mail shows: ' . $expected);
    check(str_contains($body, "Über uns: <script>alert('x')</script> & Foto\nZweite Zeile"), 'Visitor text is carried as literal plain text');
    $mediaBody = $transport->body(Input::validate(asInput(mediaPayload()))['data']);
    foreach ([
        "Projekt:\nNur Foto oder Video", "Ziel:\nFotos und Videos für das Unternehmen", "Medienwunsch:\nFotos und Kurzclip", "Verwendung:\nWeitergabe an Dritte, Website",
        "Ort:\nAußerhalb der Region", "Standorte:\nMehrere Standorte", "Drohne:\ngewünscht", 'Summe: 590 € + 4 offene Positionen. Kein vollständiger Gesamtpreis.',
    ] as $expected) check(str_contains($mediaBody, $expected), 'Media mail shows: ' . $expected);
    check(!str_contains($mediaBody, 'Domain und Hosting') && !str_contains($mediaBody, 'Umfang:'), 'Media mail has no website hosting or scope');
    $adviceBody = $transport->body(Input::validate(asInput(payload(['projectType' => 'advice', 'shownLines' => [], 'extensions' => [], 'removedLines' => []])))['data']);
    check(str_contains($adviceBody, 'direkter Kontakt gewünscht') && !str_contains($adviceBody, 'Preisorientierung') && !str_contains($adviceBody, "Ziel:\n"), 'Advice mail has no price or goal');
    $onlyOpen = $transport->body(Input::validate(asInput(mediaPayload(['shownLines' => [line('media_open', 'open')]])))['data']);
    check(str_contains($onlyOpen, 'Summe: Noch keine Summe möglich: 1 offene Position. Kein vollständiger Gesamtpreis.'), 'Open positions never form a lone sum');

    require __DIR__ . '/TestSMTP.php';
    foreach (['accepted', 'connect_failure', 'data_failure', 'quit_failure'] as $scenario) {
        $smtp = new TestSMTP($scenario);
        $outcome = (new IonosTransport($c))->submit(Input::validate(asInput(payload()))['data'], $smtp);
        check($outcome === match ($scenario) { 'connect_failure' => 'not_sent', 'data_failure' => 'unknown', default => 'accepted' }, 'Actual PHPMailer send lifecycle: ' . $scenario);
        check($smtp->connection[0] === 'ssl://smtp.ionos.de' && $smtp->connection[1] === 465, 'PHPMailer connects using implicit TLS');
        if ($scenario !== 'connect_failure') check($smtp->authUser === Configuration::ADDRESS && $smtp->recipients === [Configuration::ADDRESS], 'PHPMailer authenticates and only delivers to fixed mailbox');
    }

    $public = $temporary . '/public'; mkdir($public, 0700);
    $private = $temporary . '/webbyu-private'; mkdir($private, 0700);
    $privateConfig = $private . '/inquiry.php';
    file_put_contents($privateConfig, '<?php return ' . var_export(['smtp_username' => Configuration::ADDRESS, 'smtp_password' => 'test-only', 'hmac_key' => str_repeat('a', 64), 'state_directory' => $c->stateDirectory], true) . ';');
    chmod($privateConfig, 0600);
    check(Configuration::load($public)->password === 'test-only', 'Private default configuration load');
    $contents = file_get_contents($privateConfig);
    file_put_contents($privateConfig, str_replace('<?php return', '<?php echo "do-not-expose"; return', $contents));
    ob_start(); Configuration::load($public); $noise = ob_get_clean();
    check($noise === '', 'Private config output cannot enter response');
    copy($privateConfig, $public . '/inquiry.php');
    try { Configuration::load($public, $public . '/inquiry.php'); check(false, 'Public config must fail'); } catch (RuntimeException) { check(true, 'Public config refused'); }
    file_put_contents($privateConfig, '<?php return [];');
    try { Configuration::load($public); check(false, 'Missing fields must fail'); } catch (RuntimeException) { check(true, 'Missing config fields refused'); }

    echo "Backend PHP: $tests assertions passed.\n";
} finally { removeTree($temporary); }
