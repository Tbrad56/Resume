const { test, before, after } = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';

const app = require('../src/app');

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

const csp = async (path = '/') => {
  const res = await fetch(`${base}${path}`, { headers: UA });
  return res.headers.get('content-security-policy') || '';
};

test("CSP style-src carries no 'unsafe-inline'", async () => {
  const header = await csp();
  const styleSrc = header.split(';').map((d) => d.trim()).find((d) => d.startsWith('style-src'));
  assert.ok(styleSrc, 'style-src directive missing');
  assert.ok(
    !styleSrc.includes('unsafe-inline'),
    `style-src regressed to allow inline styles: ${styleSrc}`
  );
});

test("CSP allows no 'unsafe-inline' or 'unsafe-eval' anywhere", async () => {
  const header = await csp();
  assert.ok(!header.includes('unsafe-inline'), `unsafe-inline present: ${header}`);
  assert.ok(!header.includes('unsafe-eval'), `unsafe-eval present: ${header}`);
});

test('CSP locks down objects, framing, base URI, and form targets', async () => {
  const header = await csp();
  assert.match(header, /object-src 'none'/);
  assert.match(header, /frame-ancestors 'none'/);
  assert.match(header, /base-uri 'self'/);
  assert.match(header, /form-action 'self'/);
});

test('404 page is served under the same CSP as the index', async () => {
  const header = await csp('/definitely-not-a-page');
  assert.ok(header, 'CSP missing on 404 response');
  assert.ok(!header.includes('unsafe-inline'), '404 page served with a weaker CSP');
});

test('server does not advertise its stack', async () => {
  const res = await fetch(`${base}/`, { headers: UA });
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('static assets resolve at their new /assets paths', async () => {
  for (const path of ['/assets/css/styles.css', '/assets/js/script.js']) {
    const res = await fetch(`${base}${path}`, { headers: UA });
    assert.equal(res.status, 200, `${path} did not resolve`);
  }
});

test('dotfiles under public/ are not served', async () => {
  const res = await fetch(`${base}/.env`, { headers: UA });
  assert.equal(res.status, 404);
});
