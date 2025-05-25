const assert = require('assert');
const parse = require('../lib/parse');

async function run() {
  assert.strictEqual(parse.getHost('user@gmail.com'), 'imap.gmail.com');
  assert.strictEqual(parse.getHost('user@hotmail.com'), 'imap-mail.outlook.com');
  assert.strictEqual(parse.getHost('user@outlook.com'), 'imap-mail.outlook.com');
  assert.strictEqual(parse.getHost('user@yahoo.com'), 'imap.mail.yahoo.com');
  assert.strictEqual(parse.getHost('user@foxmail.com'), 'imap.qq.com');
  assert.strictEqual(parse.getHost('user@qq.com'), 'imap.qq.com');
  console.log('test_getHost passed');
}

module.exports = run;
