import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export default function SEOHead({
  title = "AIYA Affiliate - สถิติของฉัน",
  description = "ดูสถิติและยอดค่าคอมมิชชั่นของคุณ พร้อมแชร์ลิงก์แนะนำไปยังเพื่อนและรับรายได้เสริม",
  image = "https://web.aiya.ai/og-image.jpg",
  url = "https://aiya-affiliate.vercel.app/portal",
}: SEOHeadProps) {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="AIYA, Affiliate, AI Bootcamp, ค่าคอมมิชชั่น, รายได้เสริม, AI Empire" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="AIYA Affiliate Program" />
      <meta property="og:locale" content="th_TH" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="author" content="AIYA.AI - MeGenius Company Limited" />
      <meta name="robots" content="noindex, nofollow" /> {/* Private dashboard */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
