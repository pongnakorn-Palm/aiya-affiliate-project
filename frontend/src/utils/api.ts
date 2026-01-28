import { ErrorType, createError, logError } from './errorHandler';

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string | number;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithTimeout = async (
  url: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');

        if (response.status === 401) {
          throw createError(
            ErrorType.AUTH_ERROR,
            'กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
            response.status,
            errorText
          );
        }

        if (response.status >= 500) {
          throw createError(
            ErrorType.API_ERROR,
            'เซิร์ฟเวอร์ขัดข้อง กรุณาลองอีกครั้งภายหลัง',
            response.status,
            errorText
          );
        }

        if (response.status >= 400) {
          throw createError(
            ErrorType.API_ERROR,
            'คำขอไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง',
            response.status,
            errorText
          );
        }

        throw createError(
          ErrorType.API_ERROR,
          `HTTP Error: ${response.status}`,
          response.status,
          errorText
        );
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw createError(
          ErrorType.TIMEOUT_ERROR,
          `การเชื่อมต่อใช้เวลานานเกินไป (${timeout / 1000}s)`,
          'TIMEOUT'
        );
      }

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (attempt < retries) {
          await sleep(retryDelay * (attempt + 1));
          continue;
        }
        throw createError(
          ErrorType.NETWORK_ERROR,
          'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
          'NETWORK_ERROR'
        );
      }

      if (attempt >= retries) {
        throw error;
      }

      await sleep(retryDelay * (attempt + 1));
    }
  }

  throw lastError || createError(ErrorType.UNKNOWN_ERROR, 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
};

export const apiCall = async <T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  try {
    const response = await fetchWithTimeout(url, options);
    const data = await response.json();
    return data as T;
  } catch (error) {
    logError(error, `API Call: ${url}`);
    throw error;
  }
};

export const apiGet = async <T = unknown>(
  url: string,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<T> => {
  return apiCall<T>(url, {
    ...options,
    method: 'GET',
  });
};

export const apiPost = async <T = unknown>(
  url: string,
  body?: unknown,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<T> => {
  return apiCall<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
};

export const apiPut = async <T = unknown>(
  url: string,
  body?: unknown,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<T> => {
  return apiCall<T>(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
};

export const apiDelete = async <T = unknown>(
  url: string,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<T> => {
  return apiCall<T>(url, {
    ...options,
    method: 'DELETE',
  });
};

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  call: apiCall,
};
