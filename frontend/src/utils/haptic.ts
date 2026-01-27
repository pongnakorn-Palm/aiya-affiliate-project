// Haptic Feedback Helper
export type HapticStyle = "light" | "medium" | "heavy" | "success" | "error";

const patterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 20],
  error: [30, 50, 30, 50, 30],
};

export const triggerHaptic = (style: HapticStyle = "light") => {
  if ("vibrate" in navigator) {
    navigator.vibrate(patterns[style]);
  }
};
