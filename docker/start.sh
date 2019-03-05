#!/bin/sh

export PORT="8082"
export TRUST_FORWARDED_IP="true" #only when the service is only exposed behind a reverse proxy
export PGHOST="127.0.0.1"
export PGUSER="search user"
export PGPASSWORD="password"
export PGDATABASE="search database"

node bin/www > forum-search.log