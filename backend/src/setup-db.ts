// Setup script to create the affiliates table in NeonDB
import postgres from "postgres";

const connectionString = Bun.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL not found in environment");
    process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function setup() {
    console.log("🔄 Connecting to NeonDB...");

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
        selected_product VARCHAR(50),
        note TEXT,
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
    } catch (error) {
        console.error("❌ Setup failed:", error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

setup();
