import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode, useState, useCallback, useRef } from "react";
import { triggerHaptic } from "../../utils/haptic";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

export default function PullToRefresh({
  children,
  onRefresh,
  isRefreshing = false,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const pullProgress = useTransform(y, [0, 80], [0, 1]);
  const rotate = useTransform(y, [0, 80], [0, 360]);

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Only allow pull when at the top of the scroll container
      const container = containerRef.current;
      if (container && container.scrollTop > 0) {
        y.set(0);
        return;
      }

      if (info.offset.y > 0 && !isRefreshing) {
        y.set(Math.min(info.offset.y * 0.5, 100));
        if (info.offset.y > 60 && !isPulling) {
          setIsPulling(true);
          triggerHaptic("light");
        }
      }
    },
    [isRefreshing, isPulling, y]
  );

  const handleDragEnd = useCallback(async () => {
    if (y.get() > 60 && !isRefreshing) {
      triggerHaptic("medium");
      await onRefresh();
    }
    y.set(0);
    setIsPulling(false);
  }, [y, isRefreshing, onRefresh]);

  return (
    <div ref={containerRef} className="relative overflow-hidden h-full bg-[#0F1216]">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center py-4 z-10 pointer-events-none"
        style={{ opacity: pullProgress }}
      >
        <motion.div
          style={{ rotate }}
          className={isRefreshing ? "animate-spin" : ""}
        >
          <span className="material-symbols-outlined text-yellow-400 text-2xl">
            {isRefreshing ? "sync" : "arrow_downward"}
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
