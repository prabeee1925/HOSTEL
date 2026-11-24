const fs = require('node:fs');
const path = require('node:path');

const manifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  console.error('AndroidManifest.xml not found. Run: npm run android:add');
  process.exit(1);
}
let xml = fs.readFileSync(manifestPath, 'utf8');
const exactPermission = '    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />';
if (!xml.includes('android.permission.SCHEDULE_EXACT_ALARM')) {
  xml = xml.replace(/<manifest\b[^>]*>/, match => `${match}\n${exactPermission}`);
  fs.writeFileSync(manifestPath, xml);
  console.log('Added SCHEDULE_EXACT_ALARM permission.');
} else {
  console.log('SCHEDULE_EXACT_ALARM permission is already present.');
}

// Capacitor Android 8+ notification channels reference sound resources in res/raw.
const rawDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'raw');
fs.mkdirSync(rawDir, { recursive: true });
const soundDir = path.join(process.cwd(), 'assets', 'sounds');
if (!fs.existsSync(soundDir)) {
  console.error('Alarm sound folder not found:', soundDir);
  process.exit(1);
}
const soundFiles = fs.readdirSync(soundDir).filter(name => name.toLowerCase().endsWith('.wav'));
if (!soundFiles.length) {
  console.error('No WAV alarm sounds found in assets/sounds.');
  process.exit(1);
}
for (const name of soundFiles) {
  fs.copyFileSync(path.join(soundDir, name), path.join(rawDir, name));
  console.log(`Copied Android notification sound: ${name}`);
}
