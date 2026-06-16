import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780663250146 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            -- 1. Create the reusable function for auto-updating 'updated_at' columns
            CREATE OR REPLACE FUNCTION trigger_set_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- 2. Create Enums
            CREATE TYPE otp_channel AS ENUM ('email', 'sms');
            CREATE TYPE otp_purpose AS ENUM ('login', 'register');

            -- 3. Create Tables
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE,
                mobile_number VARCHAR(20) UNIQUE,
                is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                is_mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT users_email_or_mobile_check
                    CHECK (
                        email IS NOT NULL OR mobile_number IS NOT NULL
                    )
            );

            CREATE TABLE roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT
            );

            CREATE TABLE permissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT
            );

            CREATE TABLE role_permissions (
                role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
                permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
                PRIMARY KEY (role_id, permission_id)
            );

            CREATE TABLE user_roles (
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, role_id)
            );

            CREATE TABLE user_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                refresh_token_hash TEXT NOT NULL,
                device_name VARCHAR(255),
                user_agent TEXT,
                ip_address INET,
                expires_at TIMESTAMPTZ NOT NULL,
                revoked_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE oauth_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                provider VARCHAR(50) NOT NULL,
                provider_user_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(provider, provider_user_id)
            );

            CREATE TABLE auth_otps (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                code_hash TEXT NOT NULL,
                channel otp_channel NOT NULL,
                purpose otp_purpose NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                used_at TIMESTAMPTZ,
                attempts INT NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            -- 4. Create Indexes on Foreign Keys for performance
            CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
            CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
            CREATE INDEX idx_auth_otps_user_id ON auth_otps(user_id);

            -- 5. Attach the updated_at trigger to relevant tables
            CREATE TRIGGER set_timestamp_users
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            CREATE TRIGGER set_timestamp_user_sessions
            BEFORE UPDATE ON user_sessions
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TRIGGER IF EXISTS set_timestamp_user_sessions ON user_sessions;
            DROP TRIGGER IF EXISTS set_timestamp_users ON users;

            DROP TABLE IF EXISTS auth_otps;
            DROP TABLE IF EXISTS oauth_accounts;
            DROP TABLE IF EXISTS user_sessions;
            DROP TABLE IF EXISTS user_roles;
            DROP TABLE IF EXISTS role_permissions;
            DROP TABLE IF EXISTS permissions;
            DROP TABLE IF EXISTS roles;
            DROP TABLE IF EXISTS users;

            DROP TYPE IF EXISTS otp_purpose;
            DROP TYPE IF EXISTS otp_channel;

            DROP FUNCTION IF EXISTS trigger_set_timestamp();
        `);
  }
}
