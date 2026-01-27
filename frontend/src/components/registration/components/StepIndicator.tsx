import { motion } from "framer-motion";

interface StepIndicatorProps {
  total: number;
  current: number;
  variant?: "dots" | "bars";
}

export default function StepIndicator({
  total,
  current,
  variant = "dots",
}: StepIndicatorProps) {
  if (variant === "bars") {
    return (
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              width: i === current ? 24 : i < current ? 24 : 6,
              backgroundColor:
                i < current
                  ? "rgb(74, 222, 128)" // green-400
                  : i === current
                    ? "rgb(250, 204, 21)" // yellow-400
                    : "rgba(255, 255, 255, 0.2)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-1.5 rounded-full"
          />
        ))}
      </div>
    );
  }

  // Default: dots variant (for onboarding)
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            width: i === current ? 32 : 8,
            backgroundColor:
              i === current
                ? "rgb(250, 204, 21)" // yellow-400
                : "rgba(255, 255, 255, 0.2)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );
}
