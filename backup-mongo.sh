#!/usr/bin/env sh
MONGODB_ROOT_PASSWORD=$(grep MONGODB_ROOT_PASSWORD .env | cut -d '=' -f 2)

# get date as YYYYMMDD.hhmmss
DATE=$(date +%Y%m%d.%H%M%S) # uncomment this line if you want to include the time in the backup file name

docker compose exec -it mongo sh -c 'exec mongodump --username root --password ${MONGODB_ROOT_PASSWORD} --archive' > /mnt/freebox/mongo_backups/${DATE}.archive
