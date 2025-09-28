# Local Postgres Setup (Windows PowerShell)

This repo includes a minimal schema (`db/init.sql`) for users, tokens, provider credentials, mock/demo profiles, and audit logs.

You can run Postgres either via your local installation or with Docker.

## Option A: Local installation

1) Ensure `psql` is on PATH. Verify:

```powershell
psql --version
```

2) Start PostgreSQL service (service name can vary):

```powershell
# Common service names; use the one that exists on your system
Get-Service | Where-Object {$_.Name -like '*postgres*'}
# Example start
Start-Service -Name postgresql-x64-16
```

3) Create a database and user (adjust names/passwords):

```powershell
$PGUSER = 'postgres'       # admin user
$PGDB   = 'harmonia'
$PGHOST = 'localhost'
$PGPORT = 5432
$PGPASSWORD = Read-Host -AsSecureString 'Enter Postgres password for user postgres'
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PGPASSWORD)
$Plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$env:PGPASSWORD = $Plain
psql -U $PGUSER -h $PGHOST -p $PGPORT -c "CREATE DATABASE $PGDB;" 2>$null
# Install extensions in the target DB and apply schema
psql -U $PGUSER -h $PGHOST -p $PGPORT -d $PGDB -f ./db/init.sql
```

4) Connection string examples for services (put in .env):

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/harmonia
```

## Option B: Docker

Add the Postgres section in `docker-compose.yml` (already supported if present), then run:

```powershell
docker compose up -d postgres-db
```

The service will expose 5432 and automatically run `db/init.sql` once.

## Verifying schema

```powershell
$env:PGPASSWORD = 'YOUR_PASSWORD'
psql -U postgres -h localhost -d harmonia -c "\dt"
```

You should see tables like `users`, `provider_credentials`, `demo_profiles`, `recommendation_logs`, etc.

## Next steps

- Wire services to use `DATABASE_URL` and implement actual persistence.
- Add per-user demo profiles to control mock scenarios (`low|medium|high`).
- Add a small admin endpoint to set the default scenario for a user.
