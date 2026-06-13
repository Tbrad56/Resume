const { test } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const createContactRouter = require('../routes/contact');

function makeApp(spy) {
  const app = express();
  app.use(express.json());
  app.use('/api/contact', createContactRouter(spy));
  return app;
}

function makeSpy() {
  const calls = [];
  const fn = async (msg) => { calls.push(msg); };
  fn.calls = calls;
  return fn;
}

async function post(app, body) {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, json: await res.json() };
  } finally {
    server.close();
  }
}

const valid = () => ({
  name: 'Recruiter Jane',
  email: 'jane@example.com',
  message: 'Interested in your work.',
  ts: Date.now() - 5000,
});

test('valid submission sends mail and confirms on-theme', async () => {
  const spy = makeSpy();
  const { status, json } = await post(makeApp(spy), valid());
  assert.equal(status, 200);
  assert.match(json.message, /TRANSMISSION RECEIVED/);
  assert.equal(spy.calls.length, 1);
  assert.match(spy.calls[0].subject, /Recruiter Jane/);
  assert.equal(spy.calls[0].replyTo, 'jane@example.com');
});

test('honeypot filled: fake success, no mail', async () => {
  const spy = makeSpy();
  const { status } = await post(makeApp(spy), { ...valid(), website: 'http://spam' });
  assert.equal(status, 200);
  assert.equal(spy.calls.length, 0);
});

test('submitted too fast: fake success, no mail', async () => {
  const spy = makeSpy();
  const { status } = await post(makeApp(spy), { ...valid(), ts: Date.now() - 500 });
  assert.equal(status, 200);
  assert.equal(spy.calls.length, 0);
});

test('missing ts: fake success, no mail', async () => {
  const spy = makeSpy();
  const { ts, ...rest } = valid();
  const { status } = await post(makeApp(spy), rest);
  assert.equal(status, 200);
  assert.equal(spy.calls.length, 0);
});

test('invalid email rejected with 400', async () => {
  const spy = makeSpy();
  const { status } = await post(makeApp(spy), { ...valid(), email: 'not-an-email' });
  assert.equal(status, 400);
  assert.equal(spy.calls.length, 0);
});

test('newlines stripped from name (header injection)', async () => {
  const spy = makeSpy();
  await post(makeApp(spy), { ...valid(), name: 'Jane\r\nBcc: victim@x.com' });
  assert.equal(spy.calls.length, 1);
  assert.ok(!spy.calls[0].subject.includes('\n'), 'newline leaked into subject');
});

test('mailer failure returns 502 with fallback message', async () => {
  const failing = async () => { throw new Error('smtp down'); };
  const { status, json } = await post(makeApp(failing), valid());
  assert.equal(status, 502);
  assert.match(json.error, /TRANSMISSION FAILED/);
});
