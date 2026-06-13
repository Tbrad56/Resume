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
