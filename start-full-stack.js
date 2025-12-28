#!/usr/bin/env node

/**
 * BreakApp Full Stack Startup Script
 * سكريبت تشغيل التطبيق الكامل مع التعريب العربي
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 بدء تشغيل BreakApp Full Stack مع التعريب العربي');
console.log('🚀 Starting BreakApp Full Stack with Arabic Localization');

// التحقق من وجود الملفات المطلوبة
const requiredFiles = [
  'backend/package.json',
  'frontend/package.json',
  'backend/src/config/localization.js',
  'frontend/src/config/localization.ts'
];

console.log('\n📋 التحقق من الملفات المطلوبة...');
console.log('📋 Checking required files...');

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ ملف مطلوب غير موجود: ${file}`);
    console.error(`❌ Required file missing: ${file}`);
    process.exit(1);
  }
}

console.log('✅ جميع الملفات المطلوبة موجودة');
console.log('✅ All required files found');

// تشغيل Backend
console.log('\n🔧 تشغيل الواجهة الخلفية...');
console.log('🔧 Starting Backend...');

const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'pipe',
  shell: true
});

backend.stdout.on('data', (data) => {
  console.log(`[Backend] ${data.toString().trim()}`);
});

backend.stderr.on('data', (data) => {
  console.error(`[Backend Error] ${data.toString().trim()}`);
});

// انتظار تشغيل Backend
setTimeout(() => {
  // تشغيل Frontend
  console.log('\n🎨 تشغيل الواجهة الأمامية...');
  console.log('🎨 Starting Frontend...');

  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'pipe',
    shell: true
  });

  frontend.stdout.on('data', (data) => {
    console.log(`[Frontend] ${data.toString().trim()}`);
  });

  frontend.stderr.on('data', (data) => {
    console.error(`[Frontend Error] ${data.toString().trim()}`);
  });

  // معالجة إغلاق التطبيق
  process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف التطبيق...');
    console.log('🛑 Shutting down application...');
    
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });

  console.log('\n🌟 BreakApp يعمل الآن!');
  console.log('🌟 BreakApp is now running!');
  console.log('\n📱 الواجهات المتاحة:');
  console.log('📱 Available interfaces:');
  console.log('   • Backend API: http://localhost:3000');
  console.log('   • Frontend: http://localhost:3001');
  console.log('   • Admin Dashboard: http://localhost:3001/admin');
  console.log('   • Producer Dashboard: http://localhost:3001/producer');
  console.log('\n🌍 اللغات المدعومة:');
  console.log('🌍 Supported languages:');
  console.log('   • العربية (Arabic) - RTL');
  console.log('   • English - LTR');
  console.log('\n⚡ للإيقاف اضغط Ctrl+C');
  console.log('⚡ Press Ctrl+C to stop');

}, 3000);