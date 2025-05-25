(async () => {
  try {
    await require('./test_getHost')();
    await require('./test_parse')();
    console.log('All tests passed');
  } catch (err) {
    console.error('Test failed', err);
    process.exitCode = 1;
  }
})();
