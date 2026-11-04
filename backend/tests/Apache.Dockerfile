FROM php:8.3-apache
RUN a2enmod rewrite headers \
    && printf '<Directory /var/www/html>\nAllowOverride All\n</Directory>\n' > /etc/apache2/conf-enabled/webbyu-test.conf
COPY . /var/www/html/
RUN mkdir -p /var/www/webbyu-private/state \
    && php -r 'file_put_contents("/var/www/webbyu-private/inquiry.php", "<?php return " . var_export(["smtp_username" => "lukas.wagner@webbyu.de", "smtp_password" => "test-only-never-send", "hmac_key" => str_repeat("a", 64), "state_directory" => "/var/www/webbyu-private/state"], true) . ";");' \
    && chown -R www-data:www-data /var/www/webbyu-private \
    && chmod 700 /var/www/webbyu-private /var/www/webbyu-private/state \
    && chmod 600 /var/www/webbyu-private/inquiry.php
