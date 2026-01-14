import { sql } from "./db.js";

export async function setupDatabase() {
  try {
    console.log("Setting up database...");

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        package_type VARCHAR(50) DEFAULT 'SINGLE',
        referral_code VARCHAR(50),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'paid',
        slip_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log("Database setup completed successfully.");
    return { success: true, message: "Tables created" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Allow running directly via Bun/Node
// @ts-ignore
if (import.meta.main) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
