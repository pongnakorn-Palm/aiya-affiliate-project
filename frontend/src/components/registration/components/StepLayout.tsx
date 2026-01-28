import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StepLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  centered?: boolean;
}

export default function StepLayout({
  children,
  header,
  footer,
  centered = false,
}: StepLayoutProps) {
  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#0F1216] overflow-hidden">
      {/* Header */}
      {header && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-5 pt-10 pb-3"
        >
          {header}
        </motion.header>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 px-5 flex flex-col overflow-y-auto ${
          centered ? "justify-center" : ""
        }`}
      >
        {children}
      </main>

      {/* Footer - Fixed at bottom */}
      {footer && (
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-5 pt-3 pb-6 bg-gradient-to-t from-[#0F1216] via-[#0F1216] to-transparent"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
        >
          {footer}
        </motion.footer>
      )}
    </div>
  );
}
