import { AppError } from '@/lib/errors';

export type ActionOk<T> = { ok: true; data: T };
export type ActionFail = { ok: false; code: AppError['code']; message: string };
export type ActionResult<T> = ActionOk<T> | ActionFail;

export const toActionResult = async <T>(fn: () => Promise<T>): Promise<ActionResult<T>> => {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, code: error.code, message: error.message };
    }
    console.error(error);
    return { ok: false, code: 'INTERNAL', message: 'No se pudo completar la operación.' };
  }
};
