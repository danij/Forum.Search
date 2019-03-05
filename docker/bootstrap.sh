#!/bin/bash
HOSTNAME="$1"

mkdir /forum/config/Forum.Search
mkdir /forum/logs/Forum.Search

cp /forum/repos/Forum.Search/docker/create_db_search.sh /tmp/create_db_search.sh
chmod +x /tmp/create_db_search.sh
su -c '/tmp/create_db_search.sh' postgres

cp /forum/repos/Forum.Search/docker/start.sh /forum/start/Forum.Search.sh
chmod +x /forum/start/Forum.Search.sh

sed -i 's#bin/www#/forum/repos/Forum.Search/bin/www#' /forum/start/Forum.Search.sh
sed -i 's#forum-search.log#/forum/logs/Forum.Search/forum-search.log#' /forum/start/Forum.Search.sh
sed -i 's#PGUSER="search user"#PGUSER="forumsearch"#' /forum/start/Forum.Search.sh
sed -i 's#PGPASSWORD="password"#PGPASSWORD="1234"#' /forum/start/Forum.Search.sh
sed -i 's#PGDATABASE="search database"#PGDATABASE="forum_search"#' /forum/start/Forum.Search.sh
