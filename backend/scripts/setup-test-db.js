#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Setting up test database...');

try {
  console.log('📦 Creating test database...');
  execSync('npx prisma db push --skip-generate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'postgresql://postgres:password@localhost:5432/breakapp_test' }
  });

  console.log('⚙️  Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('✅ Test database ready!');
} catch (error) {
  console.error('❌ Failed:', error.message);
  process.exit(1);
}
