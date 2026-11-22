require('dotenv').config();
const app = require('./app');
const migrate = require('./migrate');
const seed = require('./seed');

const PORT = process.env.PORT || 5000;

async function connectWithRetry(fn, attempts = 15) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      console.log(`[db] not ready (attempt ${i}/${attempts}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Could not connect to the database');
}

(async () => {
  await connectWithRetry(migrate);
  if (process.env.AUTO_SEED === 'true') await seed();
  app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
