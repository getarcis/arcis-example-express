// Fire 8 attack payloads at the running server and report which ones
// Arcis blocks. Run after `npm start`. Expected: every attack returns
// 403, every safe payload returns 200.

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const tests = [
  // category, label, sender(): -> Promise<Response>
  ['safe',          'safe input',                 () => fetch(`${BASE}/api/echo?q=hello`)],
  ['xss',           '<script> in query',          () => fetch(`${BASE}/api/echo?q=${encodeURIComponent('<script>alert(1)</script>')}`)],
  ['xss',           'event handler',              () => fetch(`${BASE}/api/echo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ x: '<img onerror="alert(1)">' }) })],
  ['sql',           "'; DROP TABLE users; --",   () => fetch(`${BASE}/api/echo?q=${encodeURIComponent("'; DROP TABLE users; --")}`)],
  ['nosql',         '{ $gt: "" } operator',       () => fetch(`${BASE}/api/echo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: { $gt: '' } }) })],
  ['path',          '../../etc/passwd',           () => fetch(`${BASE}/api/echo?file=${encodeURIComponent('../../etc/passwd')}`)],
  ['command',       '; rm -rf /',                 () => fetch(`${BASE}/api/echo?cmd=${encodeURIComponent('hi; rm -rf /')}`)],
  ['ssti',          'Jinja2 {{7*7}}',             () => fetch(`${BASE}/api/echo?t=${encodeURIComponent('{{7*7}}')}`)],
  ['xxe',           'DOCTYPE ENTITY',             () => fetch(`${BASE}/api/echo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ xml: '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>' }) })],
];

const colors = {
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', dim: '\x1b[2m', reset: '\x1b[0m',
};

let blocked = 0;
let allowed = 0;
let unexpected = 0;

console.log(`\nArcis attack demo against ${BASE}\n${'-'.repeat(64)}`);
for (const [category, label, send] of tests) {
  let outcome;
  try {
    const res = await send();
    if (category === 'safe') {
      if (res.status === 200) {
        console.log(`${colors.green}OK${colors.reset}     ${category.padEnd(8)} ${label}: 200 (passed through, as expected)`);
        allowed += 1;
      } else {
        console.log(`${colors.red}WHAT${colors.reset}   ${category.padEnd(8)} ${label}: got ${res.status}, expected 200`);
        unexpected += 1;
      }
    } else {
      if (res.status === 403) {
        console.log(`${colors.green}BLOCK${colors.reset}  ${category.padEnd(8)} ${label}: 403 (Arcis denied, as expected)`);
        blocked += 1;
      } else {
        console.log(`${colors.red}LEAK${colors.reset}   ${category.padEnd(8)} ${label}: got ${res.status}, expected 403`);
        unexpected += 1;
      }
    }
    outcome = res.status;
  } catch (err) {
    console.log(`${colors.red}ERR${colors.reset}    ${category.padEnd(8)} ${label}: ${err.message}`);
    unexpected += 1;
  }
}

console.log(`${'-'.repeat(64)}`);
console.log(`${colors.green}${blocked} attack${blocked === 1 ? '' : 's'} blocked${colors.reset}, ${allowed} safe call${allowed === 1 ? '' : 's'} passed, ${colors.yellow}${unexpected} unexpected${colors.reset}`);
process.exit(unexpected === 0 ? 0 : 1);
