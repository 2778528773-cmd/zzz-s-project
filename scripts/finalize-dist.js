const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputsDir = path.join(root, 'outputs');
const packageJsonPath = path.join(root, 'package.json');
const counterPath = path.join(root, 'build', 'dist-counter.json');

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const productName = pkg.build?.productName || pkg.productName || pkg.name;
const version = pkg.version;
const arch = 'arm64';

const baseDmgName = `${productName}-${version}-${arch}.dmg`;
const baseBlockmapName = `${baseDmgName}.blockmap`;
const dmgPath = path.join(outputsDir, baseDmgName);
const blockmapPath = path.join(outputsDir, baseBlockmapName);

if (!fs.existsSync(dmgPath)) {
  throw new Error(`Missing DMG output: ${dmgPath}`);
}

fs.mkdirSync(path.dirname(counterPath), { recursive: true });

let counter = 0;
if (fs.existsSync(counterPath)) {
  const data = JSON.parse(fs.readFileSync(counterPath, 'utf8'));
  counter = Number(data.counter) || 0;
}

counter += 1;
fs.writeFileSync(counterPath, JSON.stringify({ counter }, null, 2));

const taggedBaseName = `${productName}-${version}-b${counter}-${arch}.dmg`;
const taggedDmgPath = path.join(outputsDir, taggedBaseName);
const taggedBlockmapPath = path.join(outputsDir, `${taggedBaseName}.blockmap`);

if (fs.existsSync(taggedDmgPath)) {
  fs.unlinkSync(taggedDmgPath);
}
fs.renameSync(dmgPath, taggedDmgPath);

if (fs.existsSync(blockmapPath)) {
  if (fs.existsSync(taggedBlockmapPath)) {
    fs.unlinkSync(taggedBlockmapPath);
  }
  fs.renameSync(blockmapPath, taggedBlockmapPath);
}

console.log(taggedDmgPath);
