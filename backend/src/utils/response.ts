import { ApiResponse } from '../types';

export function success<T>(data: T, message = ''): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function error(message: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    message,
  };
}
