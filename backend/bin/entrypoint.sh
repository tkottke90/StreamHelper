#! /bin/bash

node ./node_modules/prisma/build/index.js migrate deploy

exec node dist/index.js