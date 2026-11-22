const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('[migrate] schema ready');
}

module.exports = migrate;

if (require.main === module) {
  migrate()
    .then(() => db.pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
