const bcrypt = require('bcryptjs');
const db = require('./db');
const migrate = require('./migrate');

const DEMO_PASSWORD = 'password123';

async function seed({ force = false } = {}) {
  await migrate();
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM users');
  if (rows[0].n > 0 && !force) {
    console.log('[seed] users exist, skipping');
    return;
  }
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const prof = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Prof. Meera Sharma', 'professor@joineazy.com', $1, 'admin') RETURNING id`,
    [hash]
  );
  const profId = prof.rows[0].id;

  const students = [
    ['Aarav Mehta', 'aarav@student.com', 'S1001'],
    ['Diya Patel', 'diya@student.com', 'S1002'],
    ['Kabir Singh', 'kabir@student.com', 'S1003'],
    ['Ishita Rao', 'ishita@student.com', 'S1004'],
    ['Rohan Gupta', 'rohan@student.com', 'S1005'],
    ['Sneha Nair', 'sneha@student.com', 'S1006'],
  ];
  const ids = [];
  for (const [name, email, sid] of students) {
    const r = await db.query(
      `INSERT INTO users (name, email, student_id, password_hash, role)
       VALUES ($1, $2, $3, $4, 'student') RETURNING id`,
      [name, email, sid, hash]
    );
    ids.push(r.rows[0].id);
  }

  const g1 = (await db.query(
    `INSERT INTO groups (name, owner_id) VALUES ('Team Alpha', $1) RETURNING id`, [ids[0]]
  )).rows[0].id;
  const g2 = (await db.query(
    `INSERT INTO groups (name, owner_id) VALUES ('Team Beta', $1) RETURNING id`, [ids[3]]
  )).rows[0].id;
  for (const uid of [ids[0], ids[1], ids[2]]) {
    await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [g1, uid]);
  }
  for (const uid of [ids[3], ids[4]]) {
    await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [g2, uid]);
  }

  const day = 24 * 3600 * 1000;
  const a1 = (await db.query(
    `INSERT INTO assignments (title, description, due_date, onedrive_link, assign_to, created_by)
     VALUES ($1, $2, $3, $4, 'all', $5) RETURNING id`,
    ['Database Design Project', 'Design a normalized schema and submit the ER diagram plus SQL scripts.',
     new Date(Date.now() + 7 * day), 'https://onedrive.live.com/?id=db-design-project', profId]
  )).rows[0].id;
  await db.query(
    `INSERT INTO assignments (title, description, due_date, onedrive_link, assign_to, created_by)
     VALUES ($1, $2, $3, $4, 'all', $5)`,
    ['REST API Case Study', 'Document and critique a public REST API.',
     new Date(Date.now() + 14 * day), 'https://onedrive.live.com/?id=rest-api-case-study', profId]
  );
  const a3 = (await db.query(
    `INSERT INTO assignments (title, description, due_date, onedrive_link, assign_to, created_by)
     VALUES ($1, $2, $3, $4, 'groups', $5) RETURNING id`,
    ['Capstone Proposal (Team Alpha only)', 'One-page proposal for your capstone.',
     new Date(Date.now() - 2 * day), 'https://onedrive.live.com/?id=capstone-proposal', profId]
  )).rows[0].id;
  await db.query('INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2)', [a3, g1]);
  await db.query(
    'INSERT INTO submissions (assignment_id, group_id, confirmed_by) VALUES ($1, $2, $3)',
    [a1, g1, ids[0]]
  );

  console.log('[seed] demo data created. Professor: professor@joineazy.com / ' + DEMO_PASSWORD);
  console.log('[seed] Students: aarav@student.com ... / ' + DEMO_PASSWORD);
}

module.exports = seed;

if (require.main === module) {
  seed({ force: process.argv.includes('--force') })
    .then(() => db.pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
