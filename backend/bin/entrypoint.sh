#! /bin/bash

echo "##################################################"
echo "Stream Helper API"
echo 
echo "  Environment:"
echo "    DB Type:   $DATABASE_SCHEMA"
echo "    DB Target: $DATABASE_URL"
echo 
echo "##################################################"
echo

# Execute the migration to make sure the database stays up to date
echo "> Executing Migrations"
npx prisma migrate deploy

# Start the server
echo " > Starting App"
exec node dist/index.js