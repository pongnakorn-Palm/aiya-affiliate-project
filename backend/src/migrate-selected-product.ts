// Migration script to make selected_product column nullable
import postgres from "postgres";

const connectionString = Bun.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL not found in environment");
    process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function migrate() {
    console.log("🔄 Starting migration: Make selected_product nullable");

    try {
        // Alter the column to allow NULL values
        await sql`
            ALTER TABLE affiliates
            ALTER COLUMN selected_product DROP NOT NULL
        `;

        console.log("✅ Migration completed: selected_product is now nullable");
        console.log("🎉 Database migration successful!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

migrate();
