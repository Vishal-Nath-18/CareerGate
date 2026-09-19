require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS UserApiKey (
      id TEXT NOT NULL PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      encrypted TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT 'google/gemma-4-31b-it:free',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id)
    )
  `);
  console.log("UserApiKey table created.");

  const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log("Tables in Turso now:", result.rows.map(r => r.name));
}

main();