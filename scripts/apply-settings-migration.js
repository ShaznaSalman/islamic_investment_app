const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const migrationName = '20260524183000_add_settings';
const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', migrationName, 'migration.sql');
const checksum = crypto.createHash('sha256').update(fs.readFileSync(migrationPath, 'utf8')).digest('hex');

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SystemSetting" (
      "key" TEXT NOT NULL,
      "value" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserPreference" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "key" TEXT NOT NULL,
      "value" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "UserPreference_userId_idx" ON "UserPreference"("userId")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "UserPreference_userId_key_key" ON "UserPreference"("userId", "key")
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserPreference_userId_fkey'
      ) THEN
        ALTER TABLE "UserPreference"
        ADD CONSTRAINT "UserPreference_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF to_regclass('public._prisma_migrations') IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '${migrationName}'
         ) THEN
        INSERT INTO "_prisma_migrations" (
          "id",
          "checksum",
          "finished_at",
          "migration_name",
          "logs",
          "rolled_back_at",
          "started_at",
          "applied_steps_count"
        ) VALUES (
          '${crypto.randomUUID()}',
          '${checksum}',
          NOW(),
          '${migrationName}',
          NULL,
          NULL,
          NOW(),
          1
        );
      END IF;
    END $$;
  `);

  console.log(`Applied ${migrationName}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
