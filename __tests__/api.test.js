const handler = require('../api/index');
const fetch = require('node-fetch');

jest.mock('node-fetch');

afterEach(() => {
  fetch.mockReset();
});

function createRes() {
  return { json: jest.fn() };
}

test('returns sum of numbers from both counters', async () => {
  fetch.mockResolvedValueOnce({ json: () => Promise.resolve({ number: 3 }) });
  fetch.mockResolvedValueOnce({ json: () => Promise.resolve({ number: 4 }) });

  const res = createRes();
  await handler({}, res);

  expect(res.json).toHaveBeenCalledWith({ number: 7 });
});

test('returns 0 when fetch fails', async () => {
  fetch.mockRejectedValue(new Error('fail'));

  const res = createRes();
  await handler({}, res);

  expect(res.json).toHaveBeenCalledWith({ number: 0 });
});
