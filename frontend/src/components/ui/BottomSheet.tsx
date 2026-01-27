import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { createPortal } from "react-dom";
import { ReactNode, useCallback } from "react";
import { triggerHaptic } from "../../utils/haptic";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
}: BottomSheetProps) {
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Close if dragged down more than 100px with velocity
      if (info.offset.y > 100 || info.velocity.y > 500) {
        triggerHaptic("light");
        onClose();
      }
    },
    [onClose]
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-[#1A1D21] rounded-t-3xl max-h-[90vh] overflow-hidden border-t border-white/5"
            style={{ touchAction: "none" }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-6 pb-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">{title}</h2>
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-y-auto max-h-[calc(90vh-80px)] no-scrollbar"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
