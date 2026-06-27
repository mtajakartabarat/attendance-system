import "dotenv/config";
import {Pool} from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingEvents = await client.query("SELECT count(*) FROM events");
    if (parseInt(existingEvents.rows[0].count) > 0) {
      console.log("Events already seeded, skipping.");
      return;
    }

    console.log("Seeding events...");
    await client.query(
      `INSERT INTO events (name, event_month, event_year, access_code, access_code_expiration) VALUES
       ('Rapat Pleno PW Muslimat NU Jawa Barat', 'Januari', 2025, 'PWJABAR25', '2025-12-31'),
       ('Sarasehan Muslimat NU Jawa Barat', 'Maret', 2025, 'SARASEHAN25', '2025-12-31'),
       ('Latihan Kader Muda Muslimat NU', 'Juni', 2025, 'LATKADER25', '2025-12-31')`
    );
    console.log("  Inserted 3 events");

    await client.query("COMMIT");
    console.log("Seed complete!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed error:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
