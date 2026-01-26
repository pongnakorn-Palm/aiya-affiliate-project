import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Sanitize filename - แปลงชื่อเป็น slug ที่ปลอดภัยสำหรับชื่อไฟล์
 * @param name - ชื่อที่ต้องการแปลง (เช่น "นาย ทดสอบ ระบบ")
 * @returns Sanitized filename (เช่น "nai-todsob-rab")
 */
function sanitizeFilename(name: string): string {
    // แปลงภาษาไทยเป็นอักษรโรมัน (transliteration)
    const thaiToRoman: Record<string, string> = {
        'ก': 'k', 'ข': 'kh', 'ค': 'kh', 'ฆ': 'kh', 'ง': 'ng',
        'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch', 'ญ': 'y',
        'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th', 'ฒ': 'th', 'ณ': 'n',
        'ด': 'd', 'ต': 't', 'ถ': 'th', 'ท': 'th', 'ธ': 'th', 'น': 'n',
        'บ': 'b', 'ป': 'p', 'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph', 'ฟ': 'f', 'ภ': 'ph', 'ม': 'm',
        'ย': 'y', 'ร': 'r', 'ล': 'l', 'ว': 'w',
        'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l', 'อ': 'o', 'ฮ': 'h',
        'ะ': 'a', 'ั': 'a', 'า': 'a', 'ำ': 'am',
        'ิ': 'i', 'ี': 'i', 'ึ': 'ue', 'ื': 'ue', 'ุ': 'u', 'ู': 'u',
        'เ': 'e', 'แ': 'ae', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai',
        '่': '', '้': '', '๊': '', '๋': '', '์': '', 'ํ': '',
        '฿': 'baht', '๏': '', '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
        '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
    };

    let romanized = '';
    for (const char of name.toLowerCase()) {
        if (thaiToRoman[char]) {
            romanized += thaiToRoman[char];
        } else if (/[a-z0-9]/.test(char)) {
            // Keep English letters and numbers
            romanized += char;
        } else if (char === ' ' || char === '-' || char === '_') {
            // Replace spaces and separators with dash
            romanized += '-';
        }
        // Ignore other special characters
    }

    // Clean up multiple dashes and trim
    return romanized
        .replace(/-+/g, '-')  // Replace multiple dashes with single dash
        .replace(/^-|-$/g, '') // Remove leading/trailing dashes
        .substring(0, 50);     // Limit length
}

// Cloudflare R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://pub-xxxxx.r2.dev

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.warn("⚠️  R2 storage configuration is incomplete. File upload will be disabled.");
}

// Initialize S3 Client for Cloudflare R2
const r2Client = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
    ? new S3Client({
        region: "auto",
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    })
    : null;

/**
 * Upload a file to Cloudflare R2
 * @param file - The file to upload (Blob or Buffer)
 * @param originalFilename - Original filename
 * @param accountName - ชื่อบัญชีธนาคาร (จะใช้ในชื่อไฟล์)
 * @param affiliateCode - รหัส Affiliate (จะใช้ในชื่อไฟล์)
 * @param folder - Folder path in the bucket (e.g., "passbooks")
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(
    file: Blob | Buffer,
    originalFilename: string,
    accountName: string,
    affiliateCode: string,
    folder: string = "passbooks"
): Promise<string> {
    if (!r2Client || !R2_BUCKET_NAME) {
        throw new Error("R2 storage is not configured");
    }

    // Validate file type (only images)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const fileType = file instanceof Blob ? file.type : "application/octet-stream";

    if (!allowedTypes.includes(fileType)) {
        throw new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
    }

    // Generate meaningful filename
    // Format: {affiliateCode}-{sanitizedAccountName}-{timestamp}.{ext}
    // Example: AFFILIATE001-nai-todsob-rab-1769409378905.jpg
    const fileExtension = originalFilename.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedName = sanitizeFilename(accountName);
    const timestamp = Date.now();

    const uniqueFilename = `${folder}/${affiliateCode}-${sanitizedName}-${timestamp}.${fileExtension}`;

    // Convert Blob to Buffer if needed
    const buffer = file instanceof Blob
        ? Buffer.from(await file.arrayBuffer())
        : file;

    // Upload to R2
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: uniqueFilename,
        Body: buffer,
        ContentType: fileType,
    });

    await r2Client.send(command);

    // Construct public URL
    const publicUrl = R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}/${uniqueFilename}`
        : `https://${R2_BUCKET_NAME}.r2.dev/${uniqueFilename}`;

    return publicUrl;
}

/**
 * Check if R2 storage is configured and available
 */
export function isR2Available(): boolean {
    return r2Client !== null && !!R2_BUCKET_NAME;
}
