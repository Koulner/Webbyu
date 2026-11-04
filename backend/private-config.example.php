<?php
// Template only. Complete this privately on the server, OUTSIDE every public domain root.
// Do not put the completed file, SMTP password or generated key in this checkout or CI.
return [
    'smtp_username' => 'lukas.wagner@webbyu.de',
    'smtp_password' => '',
    'hmac_key' => '', // 64 lowercase hex characters, generated privately: bin2hex(random_bytes(32))
    'state_directory' => '', // Existing absolute private directory, permissions 0700.
];
