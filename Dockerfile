FROM busybox:1.24

RUN mkdir -p /var/www/acemyorder/public_html
COPY app/ /var/www/acemyorder/public_html/
VOLUME /var/www/acemyorder/public_html/

CMD ["true"]
