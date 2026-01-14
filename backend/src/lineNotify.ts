/**
 * LINE Notify Integration
 * Sends notifications to LINE when new affiliates register
 */

const LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN || "";
const LINE_NOTIFY_API = "https://notify-api.line.me/api/notify";

interface LineNotifyParams {
    affiliateName: string;
    email: string;
    phone: string;
    affiliateCode: string;
    selectedProduct: string;
    commission: string;
}

export async function sendLineNotify(params: LineNotifyParams): Promise<{
    success: boolean;
    error?: string;
}> {
    // Skip if token is not configured
    if (!LINE_NOTIFY_TOKEN || LINE_NOTIFY_TOKEN.trim() === "") {
        console.warn("LINE_NOTIFY_TOKEN not configured, skipping notification");
        return { success: false, error: "Token not configured" };
    }

    try {
        const packageLabel = params.selectedProduct === "single_package"
            ? "Single Package (1 ที่นั่ง)"
            : "Duo Package (2 ที่นั่ง)";

        const message = `
🎉 พันธมิตรใหม่ลงทะเบียนแล้ว!

👤 ชื่อ: ${params.affiliateName}
📧 Email: ${params.email}
📱 เบอร์: ${params.phone}
🔑 รหัสพันธมิตร: ${params.affiliateCode}
📦 Package: ${packageLabel}
💰 Commission: ${params.commission} บาท

เวลา: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
        `.trim();

        const response = await fetch(LINE_NOTIFY_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
            },
            body: new URLSearchParams({
                message: message,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("LINE Notify API error:", errorText);
            return {
                success: false,
                error: `LINE API returned ${response.status}`,
            };
        }

        const result = await response.json();
        console.log("LINE Notify sent successfully:", result);

        return { success: true };
    } catch (error: any) {
        console.error("Failed to send LINE Notify:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
