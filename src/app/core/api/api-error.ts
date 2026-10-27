import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorDetails(error: HttpErrorResponse, fallback: string) {
  const body = error.error as
    | {
        error?: { code?: string; message?: string };
        message?: string;
        meta?: { requestId?: string };
      }
    | undefined;
  return {
    code: body?.error?.code ?? 'UNKNOWN_ERROR',
    message: body?.error?.message ?? body?.message ?? fallback,
    requestId: body?.meta?.requestId ?? null,
  };
}

