import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { sql, insertAffiliate, checkConnection, checkAffiliate, getAffiliateByLineUserId, updateAffiliateBankInfo } from "./db.js";
import { sendConfirmationEmail } from "./sendEmail.js";
import { uploadToR2, isR2Available } from "./r2Storage.js";
import {
    registerAffiliate,
    checkMainSystemConnection,
    checkAffiliateCodeExists,
    checkAffiliateEmailExists,
    mainSystemSql
} from "./mainSystemDb.js";

// ========================================
// RATE LIMITING CONFIGURATION
// ========================================
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 requests per minute per IP

// Dashboard rate limiting - more generous
const dashboardRateLimitMap = new Map<string, RateLimitEntry>();
const DASHBOARD_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const DASHBOARD_RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute

// Dashboard cache
interface DashboardCacheEntry {
    data: any;
    timestamp: number;
}
const dashboardCache = new Map<string, DashboardCacheEntry>();
const DASHBOARD_CACHE_TTL = 60 * 1000; // 60 seconds cache

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
    // Clean up dashboard rate limits
    for (const [ip, entry] of dashboardRateLimitMap.entries()) {
        if (now > entry.resetTime) {
            dashboardRateLimitMap.delete(ip);
        }
    }
    // Clean up expired cache
    for (const [key, cache] of dashboardCache.entries()) {
        if (now - cache.timestamp > DASHBOARD_CACHE_TTL) {
            dashboardCache.delete(key);
        }
    }
}, 5 * 60 * 1000);

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        // First request or expired window - create new entry
        rateLimitMap.set(ip, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
        });
        return { allowed: true };
    }

    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    // Increment count
    entry.count++;
    return { allowed: true };
}

function checkDashboardRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = dashboardRateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        dashboardRateLimitMap.set(ip, {
            count: 1,
            resetTime: now + DASHBOARD_RATE_LIMIT_WINDOW,
        });
        return { allowed: true };
    }

    if (entry.count >= DASHBOARD_RATE_LIMIT_MAX_REQUESTS) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    entry.count++;
    return { allowed: true };
}

// ========================================
// INPUT VALIDATION & SANITIZATION
// ========================================
function validateLineUserId(lineUserId: string): boolean {
    // LINE User ID format: U + 32 hex characters
    const lineUserIdRegex = /^U[0-9a-f]{32}$/i;
    return lineUserIdRegex.test(lineUserId);
}

function sanitizeString(input: string): string {
    // Remove any potential SQL injection characters
    return input.replace(/[;'"\\]/g, "");
}

// ========================================
// VALIDATION CONSTANTS
// ========================================
const VALID_PRODUCTS = {
    single_package: {
        label: "Single Package (1 ที่นั่ง)",
        commission: "3,000",
    },
    duo_package: {
        label: "Duo Package (2 ที่นั่ง)",
        commission: "7,000",
    },
} as const;

type ValidProductKey = keyof typeof VALID_PRODUCTS;

// Affiliate registration validation schema
const affiliateSchema = t.Object({
    name: t.String({ minLength: 1, maxLength: 255 }),
    email: t.String({ format: "email" }),
    phone: t.String({ minLength: 9, maxLength: 20 }),
    affiliateCode: t.String({
        minLength: 3,  // Match frontend validation (requires at least 3 characters)
        maxLength: 10, // Limited to 10 characters
        pattern: "^[A-Z0-9]+$"  // Only uppercase A-Z and 0-9
    }),
    lineUserId: t.Optional(t.String()),
});

export const app = new Elysia()
    // CORS configuration for frontend
    .use(
        cors({
            origin: (request) => {
                const origin = request.headers.get("origin");
                if (!origin) return true;

                // Allow localhost and any vercel.app subdomain
                const allowedMatch =
                    origin.startsWith("http://localhost:") ||
                    origin.endsWith(".vercel.app");

                return allowedMatch;
            },
            methods: ["GET", "POST", "PUT", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        })
    )
    // Health check endpoint
    .get("/health", async () => {
        const dbConnected = await checkConnection();
        const mainSystemDbConnected = await checkMainSystemConnection();
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            database: dbConnected ? "connected" : "disconnected",
            mainSystemDatabase: mainSystemDbConnected ? "connected" : "disconnected",
        };
    })
    // Affiliate registration endpoint
    .post(
        "/api/register-affiliate",
        async ({ body, set, request }) => {
            // ========================================
            // RATE LIMITING CHECK
            // ========================================
            const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                request.headers.get("x-real-ip") ||
                "unknown";

            const rateLimitResult = checkRateLimit(clientIP);
            if (!rateLimitResult.allowed) {
                set.status = 429;
                set.headers["Retry-After"] = rateLimitResult.retryAfter?.toString() || "60";
                return {
                    success: false,
                    message: `คุณส่งคำขอบ่อยเกินไป กรุณารอ ${rateLimitResult.retryAfter} วินาที`,
                    retryAfter: rateLimitResult.retryAfter,
                };
            }

            // Explicitly cast body to ensure TypeScript knows the structure
            const data = body as {
                name: string;
                email: string;
                phone: string;
                affiliateCode: string;
                lineUserId?: string;
            };

            try {
                // Insert affiliate into database
                const affiliate = await insertAffiliate({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    affiliateCode: data.affiliateCode,
                    lineUserId: data.lineUserId,
                });

                console.log(`Affiliate registered: ID ${affiliate.id}, Code ${data.affiliateCode}`);

                // ========================================
                // SEND CONFIRMATION EMAIL
                // ========================================
                const emailResult = await sendConfirmationEmail(
                    data.email,
                    data.name.split(' ')[0], // Extract first name from full name
                    data.affiliateCode
                );

                if (!emailResult.success) {
                    console.warn(
                        `Email failed for ${data.email}: ${emailResult.error}`
                    );
                } else {
                    console.log(`Confirmation email sent: ${emailResult.messageId}`);
                }

                return {
                    success: true,
                    message: "ลงทะเบียนสำเร็จ",
                    affiliateId: affiliate.id,
                    affiliateCode: data.affiliateCode,
                    emailSent: emailResult.success,
                };
            } catch (error) {
                console.error("Affiliate registration error:", error);

                // ========================================
                // IMPROVED ERROR HANDLING WITH FIELD INFO
                // ========================================
                if (
                    error instanceof Error &&
                    error.message.includes("unique constraint")
                ) {
                    // Determine which unique constraint was violated
                    if (error.message.includes("email")) {
                        set.status = 409;
                        return {
                            success: false,
                            message: "อีเมลนี้ถูกลงทะเบียนแล้ว",
                            field: "email",
                            errorType: "duplicate",
                        };
                    } else if (error.message.includes("affiliate_code")) {
                        set.status = 409;
                        return {
                            success: false,
                            message: "รหัสพันธมิตรนี้ถูกใช้งานแล้ว",
                            field: "affiliateCode",
                            errorType: "duplicate",
                        };
                    }
                }

                set.status = 500;
                return {
                    success: false,
                    message: "การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง",
                };
            }
        },
        {
            body: affiliateSchema,
            error({ code, error, set }) {
                if (code === "VALIDATION") {
                    set.status = 400;
                    return {
                        success: false,
                        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่",
                        errors: error.all,
                    };
                }
            },
        })

    // Setup DB endpoint
    .get("/api/setup-db", async () => {
        const { setupDatabase } = await import("./setupDb.js");
        return await setupDatabase();
    })
    // Check affiliate endpoint
    .get("/api/check-affiliate", async ({ query }) => {
        const { email, affiliateCode } = query as {
            email?: string;
            affiliateCode?: string;
        };

        if (!email && !affiliateCode) {
            return { exists: false };
        }

        // Logic ใหม่: เช็คทั้ง Local DB และ Main System DB

        // 1. เช็ค Main System ก่อน (Database ของพี่อีกทีม)
        if (affiliateCode) {
            const existsInMain = await checkAffiliateCodeExists(affiliateCode);
            if (existsInMain) return { exists: true };
        }

        if (email) {
            const emailExistsInMain = await checkAffiliateEmailExists(email);
            if (emailExistsInMain) return { exists: true };
        }

        // 2. ถ้าไม่เจอใน Main System ค่อยมาเช็คใน Local DB ของเรา (เผื่อมีคนเพิ่งสมัครตะกี้)
        const existsInLocal = email
            ? await checkAffiliate(email, undefined)
            : await checkAffiliate(undefined, affiliateCode);

        return { exists: existsInLocal };
    })
    // Register Affiliate to Main System endpoint
    .post(
        "/api/register-affiliate-main",
        async ({ body, set }) => {
            const data = body as {
                name: string;
                email: string;
                tel: string;
                generatedCode: string;
            };

            // ========================================
            // VALIDATION
            // ========================================
            if (!data.name || data.name.trim().length === 0) {
                set.status = 400;
                return {
                    success: false,
                    message: "กรุณากรอกชื่อ-นามสกุล",
                    field: "name",
                };
            }

            if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                set.status = 400;
                return {
                    success: false,
                    message: "กรุณากรอก Email ที่ถูกต้อง",
                    field: "email",
                };
            }

            if (!data.tel || data.tel.length < 9) {
                set.status = 400;
                return {
                    success: false,
                    message: "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง",
                    field: "tel",
                };
            }

            if (!data.generatedCode || !/^[A-Z0-9]+$/.test(data.generatedCode)) {
                set.status = 400;
                return {
                    success: false,
                    message: "รหัส Affiliate ไม่ถูกต้อง (ใช้ได้เฉพาะ A-Z และ 0-9)",
                    field: "generatedCode",
                };
            }

            try {
                // ========================================
                // CHECK FOR DUPLICATES
                // ========================================
                const [codeExists, emailExists] = await Promise.all([
                    checkAffiliateCodeExists(data.generatedCode),
                    checkAffiliateEmailExists(data.email),
                ]);

                if (codeExists) {
                    set.status = 409;
                    return {
                        success: false,
                        message: "รหัส Affiliate นี้ถูกใช้งานแล้ว",
                        field: "generatedCode",
                        errorType: "duplicate",
                    };
                }

                if (emailExists) {
                    set.status = 409;
                    return {
                        success: false,
                        message: "Email นี้ถูกลงทะเบียนแล้ว",
                        field: "email",
                        errorType: "duplicate",
                    };
                }

                // ========================================
                // REGISTER AFFILIATE
                // ========================================
                const result = await registerAffiliate({
                    name: data.name,
                    email: data.email,
                    tel: data.tel,
                    generatedCode: data.generatedCode,
                });

                console.log(
                    `✅ Affiliate registered to main system: ID ${result.id}, Code ${result.code}`
                );

                return {
                    success: true,
                    message: "ลงทะเบียนสำเร็จ",
                    data: {
                        id: result.id,
                        code: result.code,
                    },
                };
            } catch (error: any) {
                console.error("❌ Affiliate registration error:", error);

                // Handle specific errors
                if (error.message === "DUPLICATE_CODE") {
                    set.status = 409;
                    return {
                        success: false,
                        message: "รหัส Affiliate นี้ถูกใช้งานแล้ว",
                        field: "generatedCode",
                        errorType: "duplicate",
                    };
                }

                if (error.message === "DUPLICATE_ENTRY") {
                    set.status = 409;
                    return {
                        success: false,
                        message: "ข้อมูลนี้ถูกลงทะเบียนแล้ว",
                        errorType: "duplicate",
                    };
                }

                // Generic error
                set.status = 500;
                return {
                    success: false,
                    message: "การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง",
                };
            }
        },
        {
            body: t.Object({
                name: t.String({ minLength: 1, maxLength: 255 }),
                email: t.String({ format: "email" }),
                tel: t.String({ minLength: 9, maxLength: 20 }),
                generatedCode: t.String({
                    minLength: 3,  // Match frontend validation (requires at least 3 characters)
                    maxLength: 10, // Limited to 10 characters
                    pattern: "^[A-Z0-9]+$",
                }),
            }),
            error({ code, error, set }) {
                if (code === "VALIDATION") {
                    set.status = 400;
                    return {
                        success: false,
                        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่",
                        errors: error.all,
                    };
                }
            },
        }
    )
    // Partner Dashboard endpoint
    .get("/api/affiliate/dashboard/:lineUserId", async ({ params, set, request }) => {
        const { lineUserId } = params;

        // ========================================
        // INPUT VALIDATION
        // ========================================
        if (!lineUserId) {
            set.status = 400;
            return {
                success: false,
                message: "LINE User ID is required",
            };
        }

        // Validate LINE User ID format
        if (!validateLineUserId(lineUserId)) {
            set.status = 400;
            return {
                success: false,
                message: "Invalid LINE User ID format",
            };
        }

        // Sanitize lineUserId (extra safety)
        const sanitizedLineUserId = sanitizeString(lineUserId);

        // ========================================
        // RATE LIMITING CHECK
        // ========================================
        const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown";

        const rateLimitResult = checkDashboardRateLimit(clientIP);
        if (!rateLimitResult.allowed) {
            set.status = 429;
            set.headers["Retry-After"] = rateLimitResult.retryAfter?.toString() || "60";
            return {
                success: false,
                message: `กรุณารอ ${rateLimitResult.retryAfter} วินาที ก่อนรีเฟรชอีกครั้ง`,
                retryAfter: rateLimitResult.retryAfter,
            };
        }

        // ========================================
        // CACHE CHECK
        // ========================================
        const cacheKey = `dashboard:${sanitizedLineUserId}`;
        const cachedData = dashboardCache.get(cacheKey);
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp) < DASHBOARD_CACHE_TTL) {
            // Return cached data
            return {
                success: true,
                data: cachedData.data,
                cached: true,
            };
        }

        try {
            // Step 1: Query local DB to get affiliate_code using lineUserId
            const localAffiliate = await getAffiliateByLineUserId(sanitizedLineUserId);

            if (!localAffiliate) {
                set.status = 404;
                return {
                    success: false,
                    message: "Affiliate not found. Please register first.",
                };
            }

            // Step 2: Query main system DB to get stats using affiliate_code
            const affiliateCode = localAffiliate.affiliate_code;

            const mainSystemData = await mainSystemSql`
                SELECT
                    total_registrations,
                    total_commission,
                    approved_commission,
                    pending_commission
                FROM bootcamp_affiliates
                WHERE code = ${affiliateCode}
                LIMIT 1
            `;

            // Step 3: Combine and return data
            const stats = mainSystemData.length > 0 ? mainSystemData[0] : {
                total_registrations: 0,
                total_commission: 0,
                approved_commission: 0,
                pending_commission: 0,
            };

            const responseData = {
                affiliate: {
                    name: localAffiliate.name,
                    email: localAffiliate.email,
                    phone: localAffiliate.phone,
                    affiliateCode: localAffiliate.affiliate_code,
                    createdAt: localAffiliate.created_at,
                    bankName: localAffiliate.bank_name || null,
                    bankAccountNumber: localAffiliate.bank_account_number || null,
                    bankAccountName: localAffiliate.bank_account_name || null,
                    bankPassbookUrl: localAffiliate.bank_passbook_url || null,
                },
                stats: {
                    totalRegistrations: stats.total_registrations,
                    totalCommission: stats.total_commission,
                    approvedCommission: stats.approved_commission,
                    pendingCommission: stats.pending_commission,
                },
            };

            // Cache the response
            dashboardCache.set(cacheKey, {
                data: responseData,
                timestamp: Date.now(),
            });

            return {
                success: true,
                data: responseData,
                cached: false,
            };
        } catch (error: any) {
            console.error("Dashboard API error:", error);
            set.status = 500;
            return {
                success: false,
                message: "Failed to fetch dashboard data",
            };
        }
    })
    // Referral History endpoint
    .get("/api/affiliate/referrals/:lineUserId", async ({ params, set, request }) => {
        const { lineUserId } = params;

        // ========================================
        // INPUT VALIDATION
        // ========================================
        if (!lineUserId) {
            set.status = 400;
            return {
                success: false,
                message: "LINE User ID is required",
            };
        }

        if (!validateLineUserId(lineUserId)) {
            set.status = 400;
            return {
                success: false,
                message: "Invalid LINE User ID format",
            };
        }

        const sanitizedLineUserId = sanitizeString(lineUserId);

        // ========================================
        // RATE LIMITING CHECK
        // ========================================
        const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown";

        const rateLimitResult = checkDashboardRateLimit(clientIP);
        if (!rateLimitResult.allowed) {
            set.status = 429;
            set.headers["Retry-After"] = rateLimitResult.retryAfter?.toString() || "60";
            return {
                success: false,
                message: `กรุณารอ ${rateLimitResult.retryAfter} วินาที ก่อนลองอีกครั้ง`,
                retryAfter: rateLimitResult.retryAfter,
            };
        }

        try {
            // Step 1: Get affiliate code from local DB
            const localAffiliate = await getAffiliateByLineUserId(sanitizedLineUserId);

            if (!localAffiliate) {
                set.status = 404;
                return {
                    success: false,
                    message: "Affiliate not found",
                };
            }

            // Step 2: Query referral history from main system DB
            let referrals: any[] = [];

            try {
                // Query registrations and join with affiliates to get commission values
                referrals = await mainSystemSql`
                    SELECT
                        r.id,
                        r.customer_name,
                        r.email,
                        r.package_code,
                        r.package_name,
                        r.amount,
                        r.original_amount,
                        r.referral_discount,
                        r.status,
                        r.payment_status,
                        r.created_at,
                        CASE
                            WHEN r.package_code = 'duo' THEN a.duo_commission_value
                            ELSE a.single_commission_value
                        END as commission_amount
                    FROM bootcamp_registrations r
                    LEFT JOIN bootcamp_affiliates a ON r.affiliate_code = a.code
                    WHERE r.affiliate_code = ${localAffiliate.affiliate_code}
                    ORDER BY r.created_at DESC
                    LIMIT 100
                `;
            } catch (dbError: any) {
                // If table doesn't exist or query fails, return empty array
                console.warn("Database query warning:", dbError.message);
                referrals = [];
            }

            // Map commission status from payment_status
            const mapCommissionStatus = (status: string, paymentStatus: string) => {
                if (paymentStatus === 'paid') return 'paid';
                if (status === 'completed' || status === 'checked_in') return 'approved';
                return 'pending';
            };

            return {
                success: true,
                data: {
                    referrals: referrals.map((r: any) => {
                        // Split customer_name into first and last name
                        const nameParts = (r.customer_name || '').trim().split(' ');
                        const firstName = nameParts[0] || '';
                        const lastName = nameParts.slice(1).join(' ') || '';

                        return {
                            id: r.id,
                            firstName,
                            lastName,
                            email: r.email,
                            packageType: r.package_name || r.package_code,
                            commissionAmount: r.commission_amount || 0,
                            commissionStatus: mapCommissionStatus(r.status, r.payment_status),
                            createdAt: r.created_at,
                        };
                    }),
                    total: referrals.length,
                },
            };
        } catch (error: any) {
            console.error("Referral history error:", error);
            set.status = 500;
            return {
                success: false,
                message: "Failed to fetch referral history",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            };
        }
    })
    // Update Affiliate Profile (Bank Info + Passbook Image)
    .put("/api/affiliate/profile/:lineUserId", async ({ params, body, set, request }) => {
        const { lineUserId } = params;

        // ========================================
        // INPUT VALIDATION
        // ========================================
        if (!lineUserId) {
            set.status = 400;
            return {
                success: false,
                message: "LINE User ID is required",
            };
        }

        if (!validateLineUserId(lineUserId)) {
            set.status = 400;
            return {
                success: false,
                message: "Invalid LINE User ID format",
            };
        }

        const sanitizedLineUserId = sanitizeString(lineUserId);

        // ========================================
        // RATE LIMITING CHECK
        // ========================================
        const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown";

        const rateLimitResult = checkDashboardRateLimit(clientIP);
        if (!rateLimitResult.allowed) {
            set.status = 429;
            set.headers["Retry-After"] = rateLimitResult.retryAfter?.toString() || "60";
            return {
                success: false,
                message: `กรุณารอ ${rateLimitResult.retryAfter} วินาที ก่อนลองอีกครั้ง`,
                retryAfter: rateLimitResult.retryAfter,
            };
        }

        try {
            // Verify affiliate exists
            const affiliate = await getAffiliateByLineUserId(sanitizedLineUserId);
            if (!affiliate) {
                set.status = 404;
                return {
                    success: false,
                    message: "Affiliate not found",
                };
            }

            // Parse form data
            const formData = body as any;
            const bankName = formData.bankName as string;
            const accountNumber = formData.accountNumber as string;
            const accountName = formData.accountName as string;
            const passbookImage = formData.passbookImage as File | undefined;

            // Validate required fields
            if (!bankName || !accountNumber || !accountName) {
                set.status = 400;
                return {
                    success: false,
                    message: "กรุณากรอกข้อมูลธนาคารให้ครบถ้วน",
                };
            }

            // Validate account number format (10-12 digits)
            if (!/^\d{10,12}$/.test(accountNumber)) {
                set.status = 400;
                return {
                    success: false,
                    message: "เลขที่บัญชีไม่ถูกต้อง (ต้องเป็นตัวเลข 10-12 หลัก)",
                };
            }

            let passbookUrl: string | undefined;

            // Upload passbook image if provided
            if (passbookImage && passbookImage instanceof File) {
                if (!isR2Available()) {
                    console.warn("R2 storage not available, skipping image upload");
                } else {
                    try {
                        // Validate file size (max 2MB for optimal storage usage)
                        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
                        if (passbookImage.size > MAX_FILE_SIZE) {
                            set.status = 400;
                            return {
                                success: false,
                                message: "ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB",
                            };
                        }

                        passbookUrl = await uploadToR2(
                            passbookImage,
                            passbookImage.name,
                            accountName,
                            affiliate.affiliate_code,
                            "passbooks"
                        );
                        console.log(`✅ Passbook uploaded: ${passbookUrl}`);
                    } catch (uploadError: any) {
                        console.error("File upload error:", uploadError);
                        set.status = 400;
                        return {
                            success: false,
                            message: uploadError.message || "ไม่สามารถอัปโหลดรูปภาพได้",
                        };
                    }
                }
            }

            // Update database
            const updatedAffiliate = await updateAffiliateBankInfo(sanitizedLineUserId, {
                bankName,
                accountNumber,
                accountName,
                passbookUrl: passbookUrl || affiliate.bank_passbook_url, // Keep existing if not uploading new one
            });

            if (!updatedAffiliate) {
                set.status = 500;
                return {
                    success: false,
                    message: "ไม่สามารถอัปเดตข้อมูลได้",
                };
            }

            // Clear dashboard cache for this user
            const cacheKey = `dashboard:${sanitizedLineUserId}`;
            dashboardCache.delete(cacheKey);

            console.log(`✅ Profile updated for LINE User ID: ${sanitizedLineUserId}`);

            return {
                success: true,
                message: "บันทึกข้อมูลสำเร็จ",
                data: {
                    bankName: updatedAffiliate.bank_name,
                    bankAccountNumber: updatedAffiliate.bank_account_number,
                    bankAccountName: updatedAffiliate.bank_account_name,
                    bankPassbookUrl: updatedAffiliate.bank_passbook_url,
                },
            };
        } catch (error: any) {
            console.error("Profile update error:", error);
            set.status = 500;
            return {
                success: false,
                message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            };
        }
    }, {
        body: t.Object({
            bankName: t.String({ minLength: 1 }),
            accountNumber: t.String({ minLength: 10, maxLength: 12 }),
            accountName: t.String({ minLength: 1 }),
            passbookImage: t.Optional(t.File()),
        }),
        type: 'formdata',
    });

// Only listen when running directly (not via export)
// @ts-ignore
if (import.meta.main) {
    const port = process.env.PORT || 3000;
    app.listen(port);
    console.log(
        `🚀 AIYA Event Registration API running on port ${port}`
    );

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);

        try {
            // Close database connections
            console.log("Closing database connections...");
            await Promise.all([
                sql.end({ timeout: 5 }),
                mainSystemSql.end({ timeout: 5 })
            ]);
            console.log("✅ Database connections closed successfully");

            console.log("👋 Graceful shutdown completed");
            process.exit(0);
        } catch (error) {
            console.error("❌ Error during graceful shutdown:", error);
            process.exit(1);
        }
    };

    // Register shutdown handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
        console.error("💥 Uncaught Exception:", error);
        gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    process.on("unhandledRejection", (reason, promise) => {
        console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
        gracefulShutdown("UNHANDLED_REJECTION");
    });
}

export type App = typeof app;
