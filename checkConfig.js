const fs = require('fs');
const path = require('path');

const configPath = path.join(process.cwd(), 'firebase.json');

if (!fs.existsSync(configPath)) {
  console.error('firebase.json NOT found in current directory!');
  process.exit(1);
}

const content = fs.readFileSync(configPath, 'utf-8');
console.log('firebase.json content:', content);
