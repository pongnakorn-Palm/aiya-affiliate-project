import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ReactNode, useCallback, useState } from "react";
import { triggerHaptic } from "../../utils/haptic";

interface SwipeableViewProps {
  children: ReactNode[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
}

// Lower threshold = easier to swipe (more sensitive)
// Higher threshold = harder to swipe (less sensitive)
const swipeConfidenceThreshold = 5000;
const swipePower = (offset: number, velocity: number) =>
  Math.abs(offset) * velocity;

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function SwipeableView({
  children,
  activeIndex,
  onIndexChange,
}: SwipeableViewProps) {
  const [[page, direction], setPage] = useState([activeIndex, 0]);
  const totalTabs = children.length;

  // Sync with external activeIndex
  if (page !== activeIndex) {
    setPage([activeIndex, activeIndex > page ? 1 : -1]);
  }

  const paginate = useCallback(
    (newDirection: number) => {
      const newIndex = activeIndex + newDirection;
      if (newIndex >= 0 && newIndex < totalTabs) {
        triggerHaptic("light");
        onIndexChange(newIndex);
      }
    },
    [activeIndex, totalTabs, onIndexChange]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipe = swipePower(info.offset.x, info.velocity.x);

      if (swipe < -swipeConfidenceThreshold) {
        paginate(1);
      } else if (swipe > swipeConfidenceThreshold) {
        paginate(-1);
      }
    },
    [paginate]
  );

  return (
    <div className="relative overflow-hidden bg-[#0F1216]">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={activeIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="w-full touch-pan-y select-none"
        >
          {children[activeIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
