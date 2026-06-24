const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'client', 'dist', 'assets');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
const needles = [
  JSON.parse('"\u1798\u17D2\u1796\u17BB\u1787\u17A0\u1798\u17BB\u1797\u17C4\u1780\u17BB"'), // សំលៀកបំពាក់
  JSON.parse('"\u1798\u17C4\u1781\u17BB\u178A\u17BF\u178B\u17BB"'), // ឈានឈប់
];
console.log('js files:', files);
for (const needle of needles) {
  console.log('searching:', needle);
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const idx = content.indexOf(needle);
    console.log(`${file}: ${idx >= 0 ? `FOUND at ${idx}` : 'NOT FOUND'}`);
  }
}
