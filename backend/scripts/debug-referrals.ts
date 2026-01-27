// Debug script to check why referrals are not showing
import { mainSystemSql } from "../src/mainSystemDb.js";
import { sql, getAffiliateByLineUserId } from "../src/db.js";

const TEST_LINE_USER_ID = process.argv[2] || "Uf48b6b43a27f26c61ea0313b73b34d6a"; // Replace or pass as argument

async function debugReferrals() {
  console.log("🔍 Debugging referrals issue...\n");

  // Step 1: Check local affiliate
  console.log("1️⃣ Checking local affiliate by LINE User ID...");
  console.log(`   LINE User ID: ${TEST_LINE_USER_ID}\n`);

  try {
    const localAffiliate = await getAffiliateByLineUserId(TEST_LINE_USER_ID);

    if (!localAffiliate) {
      console.log("❌ Affiliate NOT FOUND in local database!");
      console.log("   This means the LINE User ID is not linked to any affiliate.\n");

      // Check if there are any affiliates at all
      const allAffiliates = await sql`SELECT id, name, email, affiliate_code, line_user_id FROM affiliates LIMIT 10`;
      console.log("   Available affiliates in local DB:");
      allAffiliates.forEach((a: any) => {
        console.log(`   - ${a.name} (${a.affiliate_code}) - LINE: ${a.line_user_id || 'NOT SET'}`);
      });

      await sql.end();
      await mainSystemSql.end();
      return;
    }

    console.log("✅ Local affiliate found:");
    console.log(`   Name: ${localAffiliate.name}`);
    console.log(`   Email: ${localAffiliate.email}`);
    console.log(`   Affiliate Code: ${localAffiliate.affiliate_code}`);
    console.log(`   LINE User ID: ${TEST_LINE_USER_ID}\n`);

    // Step 2: Check main system affiliate stats
    console.log("2️⃣ Checking main system affiliate stats...");

    try {
      const mainAffiliate = await mainSystemSql`
        SELECT code, total_registrations, total_commission, pending_commission, approved_commission
        FROM bootcamp_affiliates
        WHERE code = ${localAffiliate.affiliate_code}
        LIMIT 1
      `;

      if (mainAffiliate.length > 0) {
        console.log("✅ Main system affiliate found:");
        console.log(`   Code: ${mainAffiliate[0].code}`);
        console.log(`   Total Registrations: ${mainAffiliate[0].total_registrations}`);
        console.log(`   Total Commission: ${mainAffiliate[0].total_commission}`);
        console.log(`   Pending: ${mainAffiliate[0].pending_commission}`);
        console.log(`   Approved: ${mainAffiliate[0].approved_commission}\n`);
      } else {
        console.log("❌ Affiliate NOT FOUND in main system database!\n");
      }
    } catch (e: any) {
      console.log(`❌ Error querying bootcamp_affiliates: ${e.message}\n`);
    }

    // Step 3: Check if bootcamp_registrations table exists
    console.log("3️⃣ Checking bootcamp_registrations table...");

    try {
      // Check table exists
      const tableCheck = await mainSystemSql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'bootcamp_registrations'
        ) as exists
      `;

      if (!tableCheck[0].exists) {
        console.log("❌ Table 'bootcamp_registrations' does NOT exist!");
        console.log("   This is why the history is empty.\n");
        await sql.end();
        await mainSystemSql.end();
        return;
      }

      console.log("✅ Table exists!\n");

      // Check columns
      console.log("4️⃣ Checking table columns...");
      const columns = await mainSystemSql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'bootcamp_registrations'
        ORDER BY ordinal_position
      `;

      console.log("   Columns in bootcamp_registrations:");
      columns.forEach((col: any) => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      console.log();

      // Step 5: Query referrals
      console.log("5️⃣ Querying referrals with affiliate code...");

      // Use corrected query with actual column names
      const referrals = await mainSystemSql`
        SELECT
          r.id,
          r.customer_name,
          r.email,
          r.package_code,
          r.package_name,
          r.amount,
          r.status,
          r.payment_status,
          r.affiliate_code,
          r.created_at,
          CASE
            WHEN r.package_code = 'duo' THEN a.duo_commission_value
            ELSE a.single_commission_value
          END as commission_amount
        FROM bootcamp_registrations r
        LEFT JOIN bootcamp_affiliates a ON r.affiliate_code = a.code
        WHERE r.affiliate_code = ${localAffiliate.affiliate_code}
        ORDER BY r.created_at DESC
        LIMIT 10
      `;

      if (referrals.length === 0) {
        console.log(`❌ No referrals found with affiliate_code '${localAffiliate.affiliate_code}'`);

        // Check what affiliate codes exist
        console.log("\n   Checking what affiliate codes exist in the table...");
        const existingCodes = await mainSystemSql`
          SELECT DISTINCT affiliate_code, COUNT(*) as count
          FROM bootcamp_registrations
          WHERE affiliate_code IS NOT NULL
          GROUP BY affiliate_code
          LIMIT 10
        `;

        if (existingCodes.length > 0) {
          console.log("   Existing affiliate codes:");
          existingCodes.forEach((r: any) => {
            console.log(`   - ${r.affiliate_code} (${r.count} registrations)`);
          });
        } else {
          console.log("   No affiliate codes found in the table at all.");
        }
      } else {
        console.log(`✅ Found ${referrals.length} referral(s):`);
        referrals.forEach((r: any) => {
          console.log(`   - ${r.customer_name} | ${r.package_name} | ${r.commission_amount / 100} THB | status: ${r.status} | payment: ${r.payment_status}`);
        });
      }

    } catch (e: any) {
      console.log(`❌ Error: ${e.message}`);
      console.log(`   Full error:`, e);
    }

  } catch (e: any) {
    console.log(`❌ Unexpected error: ${e.message}`);
  }

  console.log("\n🏁 Debug complete!");
  await sql.end();
  await mainSystemSql.end();
}

debugReferrals();
