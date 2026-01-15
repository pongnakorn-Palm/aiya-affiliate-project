// Setup script to create the affiliates table in NeonDB
import postgres from "postgres";

export async function setupDatabase() {
  const connectionString = Bun.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL not found in environment");
    return {
      success: false,
      message: "DATABASE_URL not found in environment"
    };
  }

  const sql = postgres(connectionString, { ssl: "require" });

  console.log("🔄 Connecting to NeonDB and setting up database...");

  try {
    // Drop old registrations table if exists (with warning)
    console.log("⚠️  Checking for old registrations table...");
    try {
      await sql`DROP TABLE IF EXISTS registrations CASCADE`;
      console.log("✅ Old registrations table removed (if existed)");
    } catch (error) {
      console.log("ℹ️  No old registrations table found");
    }

    // Create affiliates table
    await sql`
      CREATE TABLE IF NOT EXISTS affiliates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        affiliate_code VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log("✅ Table 'affiliates' created (or already exists)");

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_affiliates_email
      ON affiliates(email)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_code
      ON affiliates(affiliate_code)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_affiliates_created_at
      ON affiliates(created_at)
    `;
    console.log("✅ Indexes created");

    console.log("\n🎉 Database setup complete!");
    return {
      success: true,
      message: "Database setup complete!"
    };
  } catch (error) {
    console.error("❌ Setup failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Setup failed"
    };
  } finally {
    await sql.end();
  }
}

// @ts-ignore
if (import.meta.main) {
  setupDatabase().then(result => {
    if (!result.success) {
      process.exit(1);
    }
  });
}
