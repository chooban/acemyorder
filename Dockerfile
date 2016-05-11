FROM busybox:1.24

RUN mkdir /site
COPY . /site
VOLUME /site

CMD ["true"]
