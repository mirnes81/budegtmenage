export type SupabaseResult<T = any> = T;

export function asAny<T>(value: T): any {
  return value as any;
}
