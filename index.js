const webServer = require('./web-server.js');
async function startup() {
  console.log('Starting application...');
  try {
    console.log('Initializing web server module...');
    await webServer.initialize();
  } catch (err) {
    console.error(err);
    process.exit(1); // Non-zero failure code
  }
}

async function shutdown(e) {
    let err = e;
    console.log('\nShutting down...');
    try {
      console.log('Closing web server module...');

      await webServer.close();
    } catch (e) {
      console.log('Encountered error', e);

      err = err || e;
    }

    console.log('Exiting process...');

    if (err) {
      process.exit(1); // Non-zero failure code
    } else {
      process.exit(0);
    }
  }

startup();

process.on('SIGTERM', () => {
    shutdown();
});

process.on('SIGINT', () => {
    shutdown();
});

process.on('uncaughtException', err => {
    console.log('Uncaught exception');
    console.error(err);
    shutdown(err);
});