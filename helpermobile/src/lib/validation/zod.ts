import { z } from 'zod';
import { validateTCNumber } from '../../utils/tcValidation';

export const trString = (label: string, min = 1) =>
  z
    .string({ error: `${label} gerekli` })
    .trim()
    .min(min, min === 1 ? `${label} gerekli` : `${label} en az ${min} karakter olmalı`);

export const trOptional = () => z.string().trim().optional().or(z.literal(''));

export const trPhone = z
  .string({ error: 'Telefon numarası gerekli' })
  .trim()
  .regex(/^[1-9]\d{9}$/, 'Geçerli bir telefon numarası girin (10 hane, 0 ile başlamaz)');

export const trPin = z
  .string({ error: 'PIN gerekli' })
  .regex(/^\d{6}$/, 'PIN 6 haneli olmalı');

export const trTcNumber = z
  .string({ error: 'TC Kimlik No gerekli' })
  .refine((v) => validateTCNumber(v).isValid, {
    error: (issue) => validateTCNumber(String(issue.input ?? '')).error || 'Geçersiz TC Kimlik No',
  });

export const trEmail = z
  .string({ error: 'E-posta gerekli' })
  .trim()
  .email('Geçerli bir e-posta adresi girin');

export const trYear = z
  .string()
  .trim()
  .min(1, 'Yıl gerekli')
  .refine((v) => {
    const y = parseInt(v, 10);
    return !Number.isNaN(y) && y >= 1900 && y <= 2100;
  }, 'Yıl 1900-2100 arasında olmalı');

export type FieldErrors<T extends Record<string, any>> = Partial<Record<keyof T, string>>;

export function flattenZodErrors<T extends Record<string, any>>(
  err: z.ZodError<T>,
): FieldErrors<T> {
  const out: FieldErrors<T> = {};
  for (const issue of err.issues) {
    const key = issue.path[0] as keyof T | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export function safeValidate<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  value: unknown,
): { ok: true; data: T } | { ok: false; errors: FieldErrors<T> } {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data as T };
  return { ok: false, errors: flattenZodErrors(result.error as z.ZodError<T>) };
}
