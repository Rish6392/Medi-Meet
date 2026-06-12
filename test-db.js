const { PrismaClient } = require('@prisma/client');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: 'postgresql://rishabh:npg_emg7kwNYVh6n@ep-little-tree-a1k2rhzq-pooler.ap-southeast-1.aws.neon.tech/medimeet?sslmode=require'
});

const adapter = new PrismaNeon(pool);
const db = new PrismaClient({ adapter });

db.user.findMany({ take: 1 })
  .then(users => {
    console.log('Prisma+Neon SUCCESS! Found', users.length, 'user(s)');
    if (users.length > 0) console.log('First user role:', users[0].role);
    return db.$disconnect();
  })
  .catch(e => {
    console.error('Prisma+Neon ERROR:', e.message);
    return db.$disconnect();
  });
