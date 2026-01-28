export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  LIFF_ERROR = 'LIFF_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  code?: string | number;
  details?: unknown;
}

export class AppErrorClass extends Error {
  type: ErrorType;
  code?: string | number;
  details?: unknown;

  constructor(type: ErrorType, message: string, code?: string | number, details?: unknown) {
    super(message);
    this.type = type;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export const createError = (
  type: ErrorType,
  message: string,
  code?: string | number,
  details?: unknown
): AppErrorClass => {
  return new AppErrorClass(type, message, code, details);
};

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppErrorClass) {
    return {
      type: error.type,
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
      originalError: error,
    };
  }

  if (error instanceof Error) {
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        message: 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองอีกครั้ง',
        originalError: error,
      };
    }

    if (error.message.includes('LIFF') || error.message.includes('liff')) {
      return {
        type: ErrorType.LIFF_ERROR,
        message: 'เกิดข้อผิดพลาดกับ LINE กรุณาเปิดในแอป LINE',
        originalError: error,
      };
    }

    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง',
      originalError: error,
    };
  }

  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง',
    details: error,
  };
};

export const getErrorMessage = (error: unknown): string => {
  const appError = handleError(error);
  return appError.message;
};

export const logError = (error: unknown, context?: string): void => {
  const appError = handleError(error);

  if (import.meta.env.DEV) {
    console.group(`❌ Error${context ? ` in ${context}` : ''}`);
    console.error('Type:', appError.type);
    console.error('Message:', appError.message);
    if (appError.code) console.error('Code:', appError.code);
    if (appError.details) console.error('Details:', appError.details);
    if (appError.originalError) console.error('Original:', appError.originalError);
    console.groupEnd();
  } else {
    console.error(`Error${context ? ` in ${context}` : ''}:`, appError.message);
  }
};

export const isNetworkError = (error: unknown): boolean => {
  const appError = handleError(error);
  return appError.type === ErrorType.NETWORK_ERROR;
};

export const isAuthError = (error: unknown): boolean => {
  const appError = handleError(error);
  return appError.type === ErrorType.AUTH_ERROR;
};

export const isTimeoutError = (error: unknown): boolean => {
  const appError = handleError(error);
  return appError.type === ErrorType.TIMEOUT_ERROR;
};
