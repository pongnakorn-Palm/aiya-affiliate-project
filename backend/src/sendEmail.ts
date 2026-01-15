import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const SENDER_EMAIL = process.env.SENDER_EMAIL || "no-reply@aiya.ai";

// HTML email template with "AIYA Dark Premium" branding for affiliate registration
function getEmailTemplate(firstName: string, affiliateCode: string): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ยืนยันการลงทะเบียนพันธมิตร - Affiliate Registration Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Sukhumvit Set', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #020c17;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; background-color: #020c17; color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        
        <!-- Main Card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #0b1623; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Image/Logo Area -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <img src="https://ai-empire-registration.vercel.app/logo-ignite-white.png" alt="AIYA" style="max-width: 180px; height: auto; display: inline-block;" />
              <p style="margin: 15px 0 0 0; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">AIYA Affiliate Program</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 24px; text-align: center;">ยินดีต้อนรับสู่ AIYA Affiliate Program! 🎉</h2>

              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                สวัสดีครับ คุณ <strong style="color: #ffffff;">${firstName}</strong>,
              </p>

              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                ขอบคุณที่สมัครเป็นพันธมิตรกับเรา! คุณสามารถเริ่มแนะนำลูกค้าและรับค่าคอมมิชชั่นได้ทันที
              </p>

              <!-- Affiliate Code Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #3A23B5 0%, #5C499D 100%); border-radius: 16px; margin-bottom: 32px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(58, 35, 181, 0.3);">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <h3 style="color: #ffffff; margin: 0 0 20px 0; font-size: 18px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">🔑 รหัสพันธมิตรของคุณ</h3>

                    <div style="background-color: rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; margin: 20px 0;">
                      <p style="color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase; margin: 0 0 10px 0;">YOUR AFFILIATE CODE</p>
                      <p style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 3px; font-family: 'Courier New', monospace;">${affiliateCode}</p>
                    </div>

                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                      ใช้รหัสนี้เพื่อแนะนำลูกค้าและรับค่าคอมมิชชั่น<br/>
                      ลูกค้าของคุณจะได้รับส่วนลดเมื่อใช้รหัสนี้
                    </p>
                  </td>
                </tr>
              </table>

              <div style="background-color: rgba(255,255,255,0.03); border-left: 4px solid #3A23B5; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 18px;">💰 ประโยชน์ที่คุณจะได้รับ</h3>
                <ul style="color: #cbd5e1; font-size: 14px; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                  <li>รับค่าคอมมิชชั่นทุกครั้งที่ลูกค้าใช้รหัสของคุณ</li>
                  <li>ลูกค้าได้รับส่วนลดพิเศษ 1,000 บาท</li>
                  <li>ติดตามยอดขายและรายได้แบบ Real-time</li>
                  <li>รับการสนับสนุนจากทีมงาน AIYA</li>
                </ul>
              </div>

              <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-bottom: 0;">
                หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมงานของเรา
              </p>
            </td>
          </tr>

          <!-- Recommended Course Section -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background-color: #FFF5E6; border-radius: 16px; padding: 30px; text-align: center; border: 1px solid #FED7AA;">
                
                <div style="display: inline-block; background-color: #EA580C; color: #ffffff; font-size: 10px; font-weight: bold; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 1px;">
                  Recommended Course
                </div>
                
                <h3 style="color: #9A3412; font-size: 22px; font-weight: 800; margin: 0 0 20px 0;">Generative AI Bootcamp</h3>
                
                <!-- Course Image (Now using Webinar Banner) -->
                <div style="width: 100%; border-radius: 12px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                  <img src="https://ai-empire-registration.vercel.app/webinar.png" alt="Master the AI Empire" style="width: 100%; height: auto; display: block;" />
                </div>
                
                <p style="color: #9A3412; font-size: 14px; line-height: 1.6; margin-bottom: 24px; font-weight: 500;">
                  อยากเก่ง AI แบบเจาะลึก? เรียนรู้การสร้าง AI Agent และ Automation เพื่อธุรกิจของคุณแบบเข้มข้น กับหลักสูตรที่ดีที่สุดจาก AIYA
                </p>
                
                <a href="https://web.aiya.ai/th/bootcamp/ai-empire" style="display: inline-block; background-color: #EA580C; color: #ffffff; font-size: 16px; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.3);">
                  ดูรายละเอียดหลักสูตร
                </a>

                <p style="color: #576d85; font-size: 14px; margin-top: 24px; font-style: italic;">
                  หวังว่าเครื่องมือนี้จะช่วยติดปีกให้ธุรกิจของคุณได้นะครับ<br>
                  แล้วพบกันในคลาสเรียนอีกครั้งครับ
                </p>

              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                © 2026 AIYA Co., Ltd. สงวนลิขสิทธิ์
              </p>
            </td>
          </tr>
        </table>

        <!-- Unsubscribe / Extra Info -->
        <p style="color: #475569; font-size: 12px; margin-top: 20px;">
          จดหมายนี้ถูกส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ
        </p>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Send confirmation email
export async function sendConfirmationEmail(
  toEmail: string,
  firstName: string,
  affiliateCode: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`Attempting to send email to: ${toEmail}`);

    // Construct sender with display name
    // Format: "Display Name" <email@address.com>
    // If SENDER_EMAIL already includes the format, use it directly
    const sender = SENDER_EMAIL.includes('<') ? SENDER_EMAIL : `AIYA <${SENDER_EMAIL}>`;

    const command = new SendEmailCommand({
      Source: sender, // Changed from SENDER_EMAIL to sender variable
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: "ยืนยันการลงทะเบียนพันธมิตร - Affiliate Registration Confirmed",
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: getEmailTemplate(firstName, affiliateCode),
            Charset: "UTF-8",
          },
          Text: {
            Data: `สวัสดีครับ คุณ ${firstName},\n\nยินดีต้อนรับสู่ AIYA Affiliate Program! 🎉\n\nขอบคุณที่สมัครเป็นพันธมิตรกับเรา คุณสามารถเริ่มแนะนำลูกค้าและรับค่าคอมมิชชั่นได้ทันที\n\nรหัสพันธมิตรของคุณ: ${affiliateCode}\n\nใช้รหัสนี้เพื่อแนะนำลูกค้าและรับค่าคอมมิชชั่น ลูกค้าของคุณจะได้รับส่วนลดเมื่อใช้รหัสนี้\n\nประโยชน์ที่คุณจะได้รับ:\n- รับค่าคอมมิชชั่นทุกครั้งที่ลูกค้าใช้รหัสของคุณ\n- ลูกค้าได้รับส่วนลดพิเศษ 1,000 บาท\n- ติดตามยอดขายและรายได้แบบ Real-time\n- รับการสนับสนุนจากทีมงาน AIYA\n\nหากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมงานของเรา\n\nAIYA Team`,
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await sesClient.send(command);
    console.log(`Email sent successfully. MessageId: ${response.MessageId}`);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error("Failed to send email FULL ERROR:", JSON.stringify(error, null, 2));
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
