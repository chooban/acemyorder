FROM nginx:1.10-alpine

RUN rm -rf /usr/share/nginx/html/
RUN ln -s /site/ /usr/share/nginx/html

COPY acemyorder.conf /etc/nginx/conf.d/default.conf
