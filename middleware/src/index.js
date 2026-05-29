import { app } from './app.js';
import { logger } from './logger.js';

const port = app.get('port');
const host = app.get('host');

if (!port || !host) {
  logger.error(`Port sau host necunoscut: ${port}, ${host}`);
  process.exit(1);
}

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});

// IIFE asincron pentru a putea folosi await la nivel superior
(async () => {
  try {
    const server = await app.listen(port, host);

    logger.info(`Listening on http://${host}:${port}`);

    server.on('error', err => {
      logger.error('HTTP Server Error:', err);
      process.exit(1);
    });

  } catch (e) {
    logger.error('Startup error:', e);
    process.exit(1);
  }
})();