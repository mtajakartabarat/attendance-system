import pkg from 'pg';
import dns from 'dns';
const { Client } = pkg;

// Resolve IPv4 address first
const hostname = 'db.vsxnkrphfdlhlnawqook.supabase.co';

dns.resolve4(hostname, async (err, addresses) => {
  if (err) {
    console.error('DNS resolve4 error:', err.message);
    // Fallback: try with hostname and SSL
    const client = new Client({
      connectionString: 'postgresql://postgres:mtaJAKBAR234@db.vsxnkrphfdlhlnawqook.supabase.co:5432/postgres',
      ssl: { rejectUnauthorized: false },
    });
    await runQueries(client);
    return;
  }
  console.log(`Resolved ${hostname} -> ${addresses[0]}`);
  
  const client = new Client({
    host: addresses[0],
    port: 5432,
    user: 'postgres',
    password: 'mtaJAKBAR234',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });
  await runQueries(client);
});

async function runQueries(client) {
  const queries = [
    `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'events' ORDER BY ordinal_position;`,
    `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'attendees' ORDER BY ordinal_position;`,
    `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'attendance' ORDER BY ordinal_position;`,
    `SELECT * FROM information_schema.table_constraints WHERE table_name IN ('events', 'attendees', 'attendance') AND constraint_type = 'PRIMARY KEY';`,
    `SELECT * FROM events LIMIT 10;`,
    `SELECT * FROM attendees LIMIT 10;`,
    `SELECT * FROM attendance LIMIT 10;`,
  ];

  try {
    await client.connect();
    for (let i = 0; i < queries.length; i++) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`QUERY ${i + 1}:`);
      console.log(`${'='.repeat(70)}`);
      console.log(queries[i].trim());
      console.log(`\nRESULT:`);
      const res = await client.query(queries[i]);
      if (res.rows.length === 0) {
        console.log('(no rows)');
      } else {
        console.log(JSON.stringify(res.rows, null, 2));
      }
      console.log(`(${res.rows.length} row(s))`);
    }
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
