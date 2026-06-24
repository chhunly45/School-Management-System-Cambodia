const fs = require('fs');
const path = require('path');
const bundlePath = path.join(process.cwd(), 'client', 'dist', 'assets', 'index-Bb1EHezV.js');
const bundle = fs.readFileSync(bundlePath, 'utf8');
const needles = [
  'សំលៀកបំពាក់',
  'ឈានឈប់'
];
needles.forEach((needle) => {
  const idx = bundle.indexOf(needle);
  console.log(`${needle}: ${idx >= 0 ? `FOUND at ${idx}` : 'NOT FOUND'}`);
});
