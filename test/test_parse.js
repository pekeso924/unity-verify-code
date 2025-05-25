const assert = require('assert');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const parseModule = require('../lib/parse');

class FakeStream extends EventEmitter {
  constructor(data) {
    super();
    this._data = data;
  }
  start() {
    process.nextTick(() => {
      this.emit('data', Buffer.from(this._data));
    });
  }
}

class FakeFetch extends EventEmitter {
  constructor(data) {
    super();
    this._data = data;
  }
  start() {
    const msg = new EventEmitter();
    this.emit('message', msg, 1);
    const stream = new FakeStream(this._data);
    msg.emit('body', stream, {});
    stream.start();
  }
}

class FakeImap extends EventEmitter {
  constructor(opts) {
    super();
    this.opts = opts;
  }
  connect() {
    process.nextTick(() => this.emit('ready'));
  }
  openBox(name, readOnly, cb) {
    process.nextTick(() => cb(null, {}));
  }
  search(criteria, cb) {
    process.nextTick(() => cb(null, [1]));
  }
  fetch(results, options) {
    const f = new FakeFetch('Your verification code is 123456 and will expire in 10 minutes');
    process.nextTick(() => f.start());
    return f;
  }
  end() {
    process.nextTick(() => this.emit('end'));
  }
}

async function run() {
  const tmp = path.join(__dirname, 'code.txt');
  try { fs.unlinkSync(tmp); } catch {}
  await parseModule.parse('user@gmail.com', 'pwd', 993, false, tmp, FakeImap);
  const code = fs.readFileSync(tmp, 'utf8').trim();
  assert.strictEqual(code, '123456');
  console.log('test_parse passed');
}

module.exports = run;
