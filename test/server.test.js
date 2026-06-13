const { test, before, after } = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
process.env.RATE_GLOBAL_MAX = '100';
process.env.RATE_CONTACT_MAX = '3';

const app = require('../server');

let server;
let base;
const UA = { 'user-agent': 'test-browser' };

before(() => new Promise((resolve) => {
  server = app.listen(0, () => {
    base = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));

after(() => server.close());

test('GET / serves the resume page', async () => {
  const res = await fetch(`${base}/`, { headers: UA });
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /Tai Bradley/);
});

test('unknown path returns themed 404', async () => {
  const res = await fetch(`${base}/nope`, { headers: UA });
  assert.equal(res.status, 404);
  const body = await res.text();
  assert.match(body, /FILE NOT FOUND/);
});

test('helmet security headers present', async () => {
  const res = await fetch(`${base}/`, { headers: UA });
  assert.ok(res.headers.get('content-security-policy'), 'CSP missing');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.get('strict-transport-security'), 'HSTS missing');
});

test('API rejects bot-like user agents', async () => {
  const res = await fetch(`${base}/api/contact`, {
    method: 'POST',
    headers: { 'user-agent': 'curl/8.0', 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(res.status, 403);
});

test('contact endpoint rate limits after RATE_CONTACT_MAX requests', async () => {
  let lastStatus = 0;
  for (let i = 0; i < 4; i++) { // limit is 3 in tests
    const res = await fetch(`${base}/api/contact`, {
      method: 'POST',
      headers: { ...UA, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', email: 'bad', message: 'x', ts: Date.now() - 5000 }),
    });
    lastStatus = res.status;
  }
  assert.equal(lastStatus, 429);
});
