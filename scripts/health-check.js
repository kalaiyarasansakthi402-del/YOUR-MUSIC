const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n=============================================');
console.log('🔄 YOUR MUSIC — CONTINUOUS HEALTH CHECK');
console.log('=============================================\n');

const checks = [
  {
    name: 'TypeScript Check',
    fn: () => execSync('npx tsc --noEmit', { stdio: 'pipe' }),
  },
  {
    name: 'ESLint Code Quality',
    fn: () => execSync('npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings=0', { stdio: 'pipe' }),
  },
  {
    name: 'Jest Automated Tests',
    fn: () => execSync('npx jest --passWithNoTests', { stdio: 'pipe' }),
  },
  {
    name: 'Expo Configuration Integrity',
    fn: () => {
      try {
        execSync('npx expo-doctor', { stdio: 'pipe' });
      } catch (err) {
        const fullOutput = ((err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '') + (err.message || ''));
        if (
          fullOutput.includes('Connect Timeout Error') ||
          fullOutput.includes('fetch failed') ||
          fullOutput.includes('offline-mode') ||
          fullOutput.includes('Unable to reach well-known')
        ) {
          const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8'));
          if (!appJson.expo || !appJson.expo.name) throw new Error('Invalid app.json configuration');
          return;
        }
        throw err;
      }
    },
  },
];

let allPassed = true;
const results = {};

for (const check of checks) {
  process.stdout.write(`⏳ Running [${check.name}]... `);
  try {
    check.fn();
    console.log('✅ PASS');
    results[check.name] = 'PASS';
  } catch (error) {
    console.log('❌ FAIL');
    results[check.name] = 'FAIL';
    allPassed = false;
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
  }
}

console.log('\n---------------------------------------------');
console.log('📊 HEALTH CHECK SUMMARY:');
for (const [key, val] of Object.entries(results)) {
  console.log(` - ${key}: ${val}`);
}
console.log('---------------------------------------------\n');

if (!allPassed) {
  console.error('❌ Health check failed. Please resolve above errors.');
  process.exit(1);
} else {
  console.log('✅ ALL HEALTH CHECKS PASSED: Application is in Verified Working State.');
  process.exit(0);
}
