// Inline data.js into template.html and write the standalone ../index.html
import fs from 'fs';
const tpl=fs.readFileSync('template.html','utf8'), data=fs.readFileSync('data.js','utf8');
const body=tpl.replace('/*DATA*/',()=>data);
const html=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>body{margin:0;font-size:14px}[hidden]{display:none!important}</style>
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync('../index.html',html);
console.error('wrote ../index.html', html.length,'bytes');
