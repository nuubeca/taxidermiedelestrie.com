export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export const ok = <T = void>(data?: T): ActionResult<T> => ({ success: true, data: data as T });
export const fail = (error: string): ActionResult<never> => ({ success: false, error });
