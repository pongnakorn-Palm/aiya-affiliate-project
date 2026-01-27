import postgres from "postgres";
import { v7 as uuidv7 } from "uuid";

const mainSystemConnectionString = process.env.MAIN_SYSTEM_DB_URL;

if (!mainSystemConnectionString) {
    throw new Error("MAIN_SYSTEM_DB_URL environment variable is required");
}

// Create postgres connection for Main System Database (Neon Tech)
export const mainSystemSql = postgres(mainSystemConnectionString, {
    ssl: "require",
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
});

// Helper function to check main system database connection
export async function checkMainSystemConnection(): Promise<boolean> {
    try {
        await mainSystemSql`SELECT 1`;
        return true;
    } catch (error) {
        console.error("Main System Database connection failed:", error);
        return false;
    }
}

// Type for affiliate registration input
export interface AffiliateRegistrationInput {
    name: string;
    email: string;
    tel: string;
    generatedCode: string;
}

// Type for affiliate record
export interface AffiliateRecord {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    code: string;
    commission_type: string;
    commission_value: number;
    discount_type: string;
    discount_value: number;
    total_registrations: number;
    total_commission: number;
    pending_commission: number;
    approved_commission: number;
    is_active: boolean;
    single_commission_value: number;
    single_discount_value: number;
    duo_commission_value: number;
    duo_discount_value: number;
    created_at: Date;
    updated_at: Date;
}

/**
 * Register a new affiliate in the main system database
 *
 * Business Logic:
 * - Auto-approve (is_active: true)
 * - Commission: Single 3,000 THB, Duo 7,000 THB
 * - Discount: Single 1,000 THB, Duo 2,000 THB
 * - All values stored as cents (multiply by 100)
 */
export async function registerAffiliate(
    data: AffiliateRegistrationInput
): Promise<{ id: string; code: string }> {
    // Generate UUIDv7 for the new affiliate
    const affiliateId = uuidv7();

    try {
        const result = await mainSystemSql`
            INSERT INTO bootcamp_affiliates (
                id,
                name,
                email,
                phone,
                code,
                commission_type,
                commission_value,
                discount_type,
                discount_value,
                total_registrations,
                total_commission,
                pending_commission,
                approved_commission,
                is_active,
                single_commission_value,
                single_discount_value,
                duo_commission_value,
                duo_discount_value
            ) VALUES (
                ${affiliateId},
                ${data.name},
                ${data.email || null},
                ${data.tel || null},
                ${data.generatedCode},
                'fixed',
                300000,
                'fixed',
                100000,
                0,
                0,
                0,
                0,
                true,
                300000,
                100000,
                700000,
                200000
            )
            RETURNING id, code
        `;

        return result[0] as { id: string; code: string };
    } catch (error: any) {
        console.error("Register affiliate error:", error);

        // Handle duplicate code error
        if (error.code === "23505" && error.constraint?.includes("code")) {
            throw new Error("DUPLICATE_CODE");
        }

        // Handle other constraint violations
        if (error.code === "23505") {
            throw new Error("DUPLICATE_ENTRY");
        }

        // Re-throw other errors
        throw error;
    }
}

/**
 * Check if an affiliate code already exists
 */
export async function checkAffiliateCodeExists(code: string): Promise<boolean> {
    try {
        const result = await mainSystemSql`
            SELECT id FROM bootcamp_affiliates WHERE code = ${code} LIMIT 1
        `;
        return result.length > 0;
    } catch (error) {
        console.error("Error checking affiliate code:", error);
        throw error;
    }
}

/**
 * Check if an affiliate email already exists
 */
export async function checkAffiliateEmailExists(email: string): Promise<boolean> {
    try {
        const result = await mainSystemSql`
            SELECT id FROM bootcamp_affiliates WHERE email = ${email} LIMIT 1
        `;
        return result.length > 0;
    } catch (error) {
        console.error("Error checking affiliate email:", error);
        throw error;
    }
}
