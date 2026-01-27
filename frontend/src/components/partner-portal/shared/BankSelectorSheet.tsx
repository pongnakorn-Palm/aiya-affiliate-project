import { motion } from "framer-motion";
import BottomSheet from "../../ui/BottomSheet";
import { BANKS } from "../../../constants/banks";
import { triggerHaptic } from "../../../utils/haptic";

interface BankSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBank: string;
  onSelect: (bankId: string) => void;
}

export default function BankSelectorSheet({
  isOpen,
  onClose,
  selectedBank,
  onSelect,
}: BankSelectorSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="เลือกธนาคาร">
      <div className="p-4 space-y-2">
        {BANKS.map((bank, index) => (
          <motion.button
            key={bank.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerHaptic("medium");
              onSelect(bank.id);
              onClose();
            }}
            className={`w-full p-4 flex items-center gap-4 rounded-xl transition-colors ${
              selectedBank === bank.id
                ? "bg-blue-500/20 border border-blue-500/30"
                : "bg-white/5 border border-transparent hover:bg-white/10"
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0">
              <img
                src={bank.logo}
                alt={bank.abbr}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">{bank.abbr}</p>
              <p className="text-slate-400 text-sm">{bank.name}</p>
            </div>
            {selectedBank === bank.id && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="material-symbols-outlined text-blue-400"
              >
                check_circle
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
    </BottomSheet>
  );
}
