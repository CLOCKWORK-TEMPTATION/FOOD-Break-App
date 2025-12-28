#!/usr/bin/env node

/**
 * Production Readiness Test Runner
 * تشغيل جميع اختبارات الجاهزية للإنتاج
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n🚀 BreakApp Production Readiness Tests\n'));

const tests = [
  {
    name: 'Security Tests',
    command: 'npm run test:security',
    emoji: '🔒'
  },
  {
    name: 'System Integration Tests',
    command: 'npm run test:system',
    emoji: '🔧'
  },
  {
    name: 'Unit Tests',
    command: 'npm run test:quick',
    emoji: '✅'
  }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
  console.log(chalk.yellow(`\n${test.emoji} Running ${test.name}...`));
  
  try {
    execSync(test.command, { stdio: 'inherit' });
    console.log(chalk.green(`✓ ${test.name} passed`));
    passed++;
  } catch (error) {
    console.log(chalk.red(`✗ ${test.name} failed`));
    failed++;
  }
});

console.log(chalk.blue.bold('\n📊 Test Summary:'));
console.log(chalk.green(`  Passed: ${passed}`));
console.log(chalk.red(`  Failed: ${failed}`));

if (failed === 0) {
  console.log(chalk.green.bold('\n✅ All tests passed! Ready for production.\n'));
  process.exit(0);
} else {
  console.log(chalk.red.bold('\n❌ Some tests failed. Fix issues before deploying.\n'));
  process.exit(1);
}
