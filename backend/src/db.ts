import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
}

// Create postgres connection with NeonDB
// Using postgres.js which works great with Bun and Neon Serverless
export const sql = postgres(connectionString, {
    ssl: "require",
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
});

// Helper function to check database connection
export async function checkConnection(): Promise<boolean> {
    try {
        await sql`SELECT 1`;
        return true;
    } catch (error) {
        console.error("Database connection failed:", error);
        return false;
    }
}

// Type for affiliate data
export interface AffiliateData {
    name: string;
    email: string;
    phone: string;
    affiliateCode: string;
    lineUserId?: string;
}

// Insert affiliate into database
export async function insertAffiliate(data: AffiliateData) {
    const result = await sql`
    INSERT INTO affiliates (
      name,
      email,
      phone,
      affiliate_code,
      line_user_id
    ) VALUES (
      ${data.name},
      ${data.email},
      ${data.phone},
      ${data.affiliateCode},
      ${data.lineUserId || null}
    )
    RETURNING id, created_at
  `;

    return result[0];
}

// Check if email or affiliate_code already registered
export async function checkAffiliate(
    email?: string,
    affiliateCode?: string
): Promise<boolean> {
    if (!email && !affiliateCode) {
        return false;
    }

    let result;

    if (email) {
        result = await sql`
            SELECT id FROM affiliates WHERE email = ${email} LIMIT 1
        `;
    } else if (affiliateCode) {
        result = await sql`
            SELECT id FROM affiliates WHERE affiliate_code = ${affiliateCode} LIMIT 1
        `;
    }

    return result ? result.length > 0 : false;
}

// Get affiliate by LINE user ID
export async function getAffiliateByLineUserId(lineUserId: string) {
    const result = await sql`
        SELECT id, name, email, phone, affiliate_code, created_at, bank_name, bank_account_number, bank_account_name, bank_passbook_url
        FROM affiliates
        WHERE line_user_id = ${lineUserId}
        LIMIT 1
    `;

    return result.length > 0 ? result[0] : null;
}

// Update affiliate bank information
export async function updateAffiliateBankInfo(
    lineUserId: string,
    bankData: {
        bankName: string;
        accountNumber: string;
        accountName: string;
        passbookUrl?: string;
    }
) {
    const result = await sql`
        UPDATE affiliates
        SET
            bank_name = ${bankData.bankName},
            bank_account_number = ${bankData.accountNumber},
            bank_account_name = ${bankData.accountName},
            bank_passbook_url = ${bankData.passbookUrl || null}
        WHERE line_user_id = ${lineUserId}
        RETURNING id, name, email, phone, affiliate_code, created_at, bank_name, bank_account_number, bank_account_name, bank_passbook_url
    `;

    return result.length > 0 ? result[0] : null;
}

// Create new order
export async function createOrder(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    amount: number;
    packageType: string;
    referralCode?: string;
    slipUrl?: string; // Optional for now
}) {
    const result = await sql`
        INSERT INTO orders (
            first_name, last_name, email, phone, amount, package_type, referral_code, slip_url, status
        ) VALUES (
            ${data.firstName}, 
            ${data.lastName}, 
            ${data.email}, 
            ${data.phone}, 
            ${data.amount},
            ${data.packageType},
            ${data.referralCode || null}, 
            ${data.slipUrl || null}, 
            'paid'
        )
        RETURNING id
    `;
    return result[0];
}
