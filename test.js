const assert = require('assert');

(async () => {
  // basic smoke test to ensure the handler returns a number
  const handler = require('./api/index');
  const req = {}; // dummy request
  const res = { json(data) { this.data = data; } };
  await handler(req, res);
  assert(typeof res.data.number === 'number');
  console.log('Test passed');
})();
