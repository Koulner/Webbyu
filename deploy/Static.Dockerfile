FROM php:8.3-apache
RUN a2enmod rewrite headers deflate filter \
    && printf '<Directory /var/www/html>\nAllowOverride All\n</Directory>\n' > /etc/apache2/conf-enabled/webbyu-test.conf
COPY . /var/www/html/
