#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

    -- ==============================================================================
    -- Create application database and user
    -- ==============================================================================

    CREATE DATABASE ${APP_DB:-app_db};

    CREATE USER ${APP_DB_USER:-app_user} WITH PASSWORD '${APP_DB_PASSWORD:-app_password}';

    GRANT ALL PRIVILEGES ON DATABASE ${APP_DB:-app_db} TO ${APP_DB_USER:-app_user};

    -- ==============================================================================
    -- Create n8n database and user
    -- ==============================================================================

    CREATE DATABASE ${N8N_DB:-n8n_db};

    CREATE USER ${N8N_DB_USER:-n8n_user} WITH PASSWORD '${N8N_DB_PASSWORD:-n8n_password}';

    GRANT ALL PRIVILEGES ON DATABASE ${N8N_DB:-n8n_db} TO ${N8N_DB_USER:-n8n_user};

EOSQL

# Grant schema and default privileges — required for PostgreSQL 15+
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${APP_DB:-app_db}" <<-EOSQL
    GRANT ALL ON SCHEMA public TO ${APP_DB_USER:-app_user};

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT ALL ON TABLES TO ${APP_DB_USER:-app_user};

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT ALL ON SEQUENCES TO ${APP_DB_USER:-app_user};

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT EXECUTE ON FUNCTIONS TO ${APP_DB_USER:-app_user};
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${N8N_DB:-n8n_db}" <<-EOSQL
    GRANT ALL ON SCHEMA public TO ${N8N_DB_USER:-n8n_user};

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT ALL ON TABLES TO ${N8N_DB_USER:-n8n_user};

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT ALL ON SEQUENCES TO ${N8N_DB_USER:-n8n_user};

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT EXECUTE ON FUNCTIONS TO ${N8N_DB_USER:-n8n_user};
EOSQL