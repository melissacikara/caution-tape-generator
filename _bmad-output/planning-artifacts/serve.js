const http = require('http');
const fs = require('fs');
const path = require('path');
const base = 'c:/Users/melis/OneDrive/Desktop/AI-Projects/caution-bmad/_bmad-output/planning-artifacts';
http.createServer((req, res) => {
  const fp = path.join(base, req.url.split('?')[0]);
  try {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(fp));
  } catch(e) {
    res.writeHead(404); res.end('not found');
  }
}).listen(7891, () => console.log('ready on 7891'));
