const fs = require('fs');
let c = fs.readFileSync('src/data/cropDetailData.js', 'utf8');
c = c.replace(/,,(\r?\n)\s*imageUrl:/g, ',$1    imageUrl:');
fs.writeFileSync('src/data/cropDetailData.js', c);
console.log('Fixed double commas');
