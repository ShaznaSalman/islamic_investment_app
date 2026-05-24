require('./load-env-local');
const { execSync } = require('child_process');
const path = require('path');
const root = path.join(__dirname, '..');

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit', env: process.env });
}

console.log('Islamic Investment App — database setup\n');

try {
  run('npx prisma generate');
} catch {
  process.exit(1);
}

try {
  run('npx prisma migrate deploy');
  console.log('\n✓ Migrations applied (direct connection).');
} catch (err) {
  console.warn('\n⚠ migrate deploy failed (direct URL unreachable). Trying db push via pooler…');
  try {
    run('npx prisma db push --skip-generate');
    console.log('\n✓ Schema synced with db push.');
  } catch {
    console.error('\n✗ Could not apply schema. Fix DIRECT_URL / network (see README steps) and retry.');
    process.exit(1);
  }
}

try {
  run('npx prisma db seed');
  console.log('\n✓ Seed data loaded.');
} catch {
  process.exit(1);
}

console.log('\nDone. Log in with owner@iia.com / Admin@12345\n');
