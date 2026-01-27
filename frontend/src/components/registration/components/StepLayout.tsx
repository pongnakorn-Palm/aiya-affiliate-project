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
    <div className="min-h-[100dvh] w-full flex flex-col bg-[#0F1216]">
      {/* Header */}
      {header && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-5 pt-12 pb-4"
        >
          {header}
        </motion.header>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 px-5 flex flex-col ${
          centered ? "justify-center" : ""
        }`}
      >
        {children}
      </main>

      {/* Footer */}
      {footer && (
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-5 pb-8"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}
        >
          {footer}
        </motion.footer>
      )}
    </div>
  );
}
