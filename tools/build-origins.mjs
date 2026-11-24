import {readFileSync, writeFileSync} from 'node:fs';
const origins = JSON.parse(readFileSync(new URL('../spec/origins.json', import.meta.url), 'utf8'));
for (const [key, table] of [['past', origins.past], ['motive', origins.motive]]) {
  if (!table || table.rows?.length !== 100) throw Error(`Expected 100 ${key} rows`);
}
writeFileSync(
  new URL('../dist/origin-catalog.js', import.meta.url),
  '// Generated from spec/origins.json by tools/build-origins.mjs.\nexport const ORIGINS=' + JSON.stringify(origins) + ';\n'
);
console.log('Built 100 past origins and 100 motives from spec/origins.json.');
