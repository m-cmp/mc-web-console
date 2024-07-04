##############################################################
## Stage 1 - Go Build Env
##############################################################

FROM golang:1.22.3-alpine AS builder

RUN apk add --no-cache gcc libc-dev musl-dev curl npm wget
RUN npm install --global yarn

RUN mkdir -p /util
WORKDIR /util
RUN wget https://github.com/gobuffalo/cli/releases/download/v0.18.14/buffalo_0.18.14_Linux_x86_64.tar.gz \
    && tar -xvzf buffalo_0.18.14_Linux_x86_64.tar.gz \
    && mv buffalo /usr/local/bin/buffalo \
    && rm buffalo_0.18.14_Linux_x86_64.tar.gz

ENV GOPROXY http://proxy.golang.org
ENV CGO_ENABLED=1
ENV PATH /usr/local/bin/yarn:$PATH

RUN mkdir -p /src/mc-web-console
WORKDIR /src/mc-web-console
ADD . .

##############################################################
## Stage 2 - Go Build [API SERVER]
##############################################################
WORKDIR /src/mc-web-console/mc_web_console_api
RUN go mod download
RUN buffalo build --static -o /bin/api

##############################################################
## Stage 3 - Go Build [FRONT SERVER]
##############################################################
WORKDIR /src/mc-web-console/mc_web_console_front
RUN go mod download
RUN npm install
RUN yarn install
RUN buffalo build --static -o /bin/front

#############################################################
## Stage 4 - Application Deploy
##############################################################

FROM debian:buster-slim

WORKDIR /bin/
COPY --from=builder /bin/api .
COPY --from=builder /bin/front .

ENV API_ADDR 0.0.0.0
ENV API_PORT 3000

ENV FRONT_ADDR 0.0.0.0
ENV FRONT_PORT 3001

ENV MCIAM_USE=true

EXPOSE 3001
EXPOSE 3000
CMD bash -c 'until /bin/api migrate; do echo "Migration failed. Retrying in 10 seconds..."; sleep 10; done; /bin/api > /bin/api.log 2>&1 & /bin/front > /bin/front.log 2>&1 & tail -f /bin/api.log & tail -f /bin/front.log & wait'