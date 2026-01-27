// Format commission (stored in cents, convert to baht)
export const formatCommission = (cents: number): string => {
  return (cents / 100).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Format relative time (e.g., "2 ชั่วโมงที่แล้ว")
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Date(date).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
};

// Format account number as xxx-x-xxxxx-x
export const formatAccountNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "");

  let formatted = "";
  if (digits.length > 0) {
    formatted = digits.substring(0, 3);
    if (digits.length > 3) {
      formatted += "-" + digits.substring(3, 4);
    }
    if (digits.length > 4) {
      formatted += "-" + digits.substring(4, 9);
    }
    if (digits.length > 9) {
      formatted += "-" + digits.substring(9, 10);
    }
  }
  return formatted;
};

// Mask email for privacy (e.g., "lalitchaya@aiya.ai" -> "lal***@aiya.ai")
export const maskEmail = (email: string): string => {
  if (!email || !email.includes("@")) return "***@***.***";

  const [localPart, domain] = email.split("@");
  const visibleChars = Math.min(3, localPart.length);
  const masked = localPart.substring(0, visibleChars) + "***";

  return `${masked}@${domain}`;
};

// Mask name for privacy (e.g., "สมชาย ใจดี" -> "สม***")
export const maskName = (name: string): string => {
  if (!name) return "***";

  // Show first 2 characters then mask the rest
  const visibleChars = Math.min(2, name.length);
  return name.substring(0, visibleChars) + "***";
};
