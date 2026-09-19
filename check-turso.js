require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log("Tables in Turso:", result.rows.map(r => r.name));
}

main();