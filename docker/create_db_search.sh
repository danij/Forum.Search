psql -c "CREATE ROLE forumsearch WITH LOGIN PASSWORD '1234';"
psql -c "CREATE DATABASE forum_search WITH OWNER = forumsearch ENCODING 'UTF8';"
psql "dbname='forum_search' user='forumsearch' password='1234' host='127.0.0.1'" -f /forum/repos/Forum.Search/tables.sql
