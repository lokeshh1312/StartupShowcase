const fs = require('fs');
const path = require('path');
const regex = /(?:india|indian|rupee|₹|\bIST\b)/i;
let matches = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx|json|css|md)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        if (regex.test(l)) matches.push(full + ':' + (i + 1) + ': ' + l.trim());
      });
    }
  }
}
walk('src');
console.log('Matches count:', matches.length);
if (matches.length > 0) {
  console.log(matches.join('\n'));
  process.exit(1);
} else {
  console.log('Zero forbidden terms found in src!');
  process.exit(0);
}
