import { useState, useRef, useEffect, useCallback } from "react";
import { formatAccountNumber } from "../../../utils/formatting";
import { triggerHaptic } from "../../../utils/haptic";

interface BankFormData {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankPassbookUrl: string | null;
}

interface ToastInterface {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

export function useBankForm(
  initialData: BankFormData | null,
  userId: string | undefined,
  toast?: ToastInterface,
  onSuccess?: () => void
) {
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [passbookImage, setPassbookImage] = useState<File | null>(null);
  const [passbookPreview, setPassbookPreview] = useState<string | null>(null);
  const [saveButtonState, setSaveButtonState] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const [originalData, setOriginalData] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when data loads
  useEffect(() => {
    if (initialData) {
      const bankName = (initialData.bankName || "").toLowerCase();
      const accountNum = initialData.bankAccountNumber || "";
      const accountN = initialData.bankAccountName || "";

      setSelectedBank(bankName);
      setAccountNumber(formatAccountNumber(accountNum));
      setAccountName(accountN);
      setPassbookPreview(initialData.bankPassbookUrl || null);

      setOriginalData({
        bankName,
        accountNumber: accountNum.replace(/\D/g, ""),
        accountName: accountN,
      });
    }
  }, [initialData]);

  const hasChanges = useCallback(() => {
    if (!originalData) return true;
    const currentDigits = accountNumber.replace(/\D/g, "");
    return (
      selectedBank !== originalData.bankName ||
      currentDigits !== originalData.accountNumber ||
      accountName !== originalData.accountName ||
      passbookImage !== null
    );
  }, [selectedBank, accountNumber, accountName, passbookImage, originalData]);

  const handleAccountNumberChange = useCallback((value: string) => {
    const formatted = formatAccountNumber(value);
    setAccountNumber(formatted);
  }, []);

  const handlePasteAccountNumber = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const formatted = formatAccountNumber(text);
      setAccountNumber(formatted);
      triggerHaptic("light");
      if (toast) {
        toast.success("วางเลขบัญชีสำเร็จ", 1500);
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      triggerHaptic("medium");
      if (toast) {
        toast.warning("ไม่สามารถวางได้ กรุณาพิมพ์เอง");
      }
    }
  }, [toast]);

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        if (toast) {
          toast.warning("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        } else {
          alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        }
        return;
      }

      // Validate file size (max 2MB)
      const MAX_FILE_SIZE = 2 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        if (toast) {
          toast.warning("ขนาดไฟล์ต้องไม่เกิน 2MB");
        } else {
          alert("ขนาดไฟล์ต้องไม่เกิน 2MB");
        }
        return;
      }

      setPassbookImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassbookPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!userId || !selectedBank || !accountNumber || !accountName) {
      if (toast) {
        toast.warning("กรุณากรอกข้อมูลให้ครบถ้วน");
      } else {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      }
      triggerHaptic("medium");
      return false;
    }

    const digitsOnly = accountNumber.replace(/\D/g, "");
    if (!/^\d{10,12}$/.test(digitsOnly)) {
      if (toast) {
        toast.warning("เลขที่บัญชีต้องเป็นตัวเลข 10-12 หลัก");
      } else {
        alert("เลขที่บัญชีต้องเป็นตัวเลข 10-12 หลัก");
      }
      triggerHaptic("medium");
      return false;
    }

    setSaveButtonState("loading");
    triggerHaptic("light");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const formData = new FormData();
      formData.append("bankName", selectedBank);
      formData.append("accountNumber", digitsOnly);
      formData.append("accountName", accountName);
      if (passbookImage) {
        formData.append("passbookImage", passbookImage);
      }

      const response = await fetch(
        `${apiUrl}/api/affiliate/profile/${userId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      if (data.success) {
        setSaveButtonState("success");
        triggerHaptic("heavy");

        // Clear the file input
        setPassbookImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Update original data to reflect saved state
        setOriginalData({
          bankName: selectedBank,
          accountNumber: digitsOnly,
          accountName,
        });

        onSuccess?.();

        // Revert button to idle after 3 seconds
        setTimeout(() => {
          setSaveButtonState("idle");
        }, 3000);

        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง";
      if (toast) {
        toast.error(errorMessage);
      } else {
        alert(errorMessage);
      }
      setSaveButtonState("idle");
      triggerHaptic("medium");
      return false;
    }
  }, [
    userId,
    selectedBank,
    accountNumber,
    accountName,
    passbookImage,
    toast,
    onSuccess,
  ]);

  return {
    selectedBank,
    setSelectedBank,
    accountNumber,
    accountName,
    setAccountName,
    passbookImage,
    passbookPreview,
    saveButtonState,
    fileInputRef,
    hasChanges,
    handleAccountNumberChange,
    handlePasteAccountNumber,
    handleImageSelect,
    handleSave,
  };
}
