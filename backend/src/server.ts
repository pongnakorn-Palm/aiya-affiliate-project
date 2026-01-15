import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { sql, insertAffiliate, checkConnection, checkAffiliate } from "./db.js";
import { sendConfirmationEmail } from "./sendEmail.js";
import {
    registerAffiliate,
    checkMainSystemConnection,
    checkAffiliateCodeExists,
    checkAffiliateEmailExists
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

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(ip);
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
        minLength: 1,
        maxLength: 50,
        pattern: "^[A-Z0-9]+$"  // Only uppercase A-Z and 0-9
    }),
    note: t.Optional(t.String({ maxLength: 2000 })),
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
            methods: ["GET", "POST", "OPTIONS"],
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
                note?: string;
            };

            try {
                // Insert affiliate into database
                const affiliate = await insertAffiliate({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    affiliateCode: data.affiliateCode,
                    note: data.note || null,
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

        const exists = email
            ? await checkAffiliate(email, undefined)
            : await checkAffiliate(undefined, affiliateCode);

        return { exists };
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
                    minLength: 1,
                    maxLength: 50,
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
    );

// Only listen when running directly (not via export)
// @ts-ignore
if (import.meta.main) {
    const port = process.env.PORT || 3000;
    app.listen(port);
    console.log(
        `🚀 AIYA Event Registration API running on port ${port}`
    );
}

export type App = typeof app;
