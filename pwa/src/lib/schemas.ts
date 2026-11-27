import { z } from 'zod';
import { parsePhone } from './phone';
import { parseAmount } from './money';
import { isValidIsoDate, localInputToIso } from './dates';
import { ACTIVITY_TYPES, LOST_REASONS, OPEN_STAGES, OPPORTUNITY_TYPES, SOURCES } from './labels';

// Validación en el servidor de toda entrada (CLAUDE.md §4.1). Mensajes en español, junto al campo.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const PHONE_MESSAGE = 'Escribe un teléfono válido, por ejemplo 600 111 222.';
const AMOUNT_MESSAGE = 'Escribe un monto válido, por ejemplo 1.800,00.';

const uuid = (message: string) => z.uuid({ error: message });
const text = (max: number, message: string) => z.string().trim().max(max, message);
/** Texto opcional: vacío se guarda como null. */
const optionalText = (max: number, message: string) =>
  text(max, message).transform((value) => (value === '' ? null : value));
const isoDate = (message: string) => z.string().trim().refine(isValidIsoDate, message);
/** Fecha opcional: vacío es null. */
const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === '' || isValidIsoDate(v), 'Escribe una fecha válida.')
  .transform((v) => (v === '' ? null : v));
const titleField = text(120, 'El título admite hasta 120 caracteres.').min(2, 'Escribe un título de al menos 2 caracteres.');
const checkbox = z
  .string()
  .optional()
  .transform((v) => v === 'on' || v === 'true');

const amount = (allowEmpty: boolean) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === '') {
        if (allowEmpty) return 0;
        ctx.issues.push({ code: 'custom', message: AMOUNT_MESSAGE, input: value });
        return z.NEVER;
      }
      if (/^-/.test(value)) {
        ctx.issues.push({ code: 'custom', message: 'El monto no puede ser negativo.', input: value });
        return z.NEVER;
      }
      const parsed = parseAmount(value);
      if (parsed === null || parsed > 9_999_999_999) {
        ctx.issues.push({ code: 'custom', message: AMOUNT_MESSAGE, input: value });
        return z.NEVER;
      }
      return parsed;
    });

export const customerSchema = z.object({
  id: uuid('Identificador no válido.').optional(),
  first_name: text(80, 'El nombre es demasiado largo.').min(1, 'Escribe el nombre.'),
  last_name: text(120, 'Los apellidos son demasiado largos.').min(1, 'Escribe los apellidos.'),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const parsed = parsePhone(value);
      if (!parsed.ok) {
        ctx.issues.push({ code: 'custom', message: PHONE_MESSAGE, input: value });
        return z.NEVER;
      }
      return parsed.value;
    }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200, 'Escribe un correo válido.')
    .refine((v) => v === '' || EMAIL.test(v), 'Escribe un correo válido.')
    .transform((v) => (v === '' ? null : v)),
  source: z.enum(SOURCES, { error: 'Elige el origen.' }),
  accepts_communications: checkbox,
  notes: optionalText(2000, 'Las notas admiten hasta 2000 caracteres.'),
  owner_id: uuid('Elige un vendedor.').optional(),
});
export type CustomerInput = z.output<typeof customerSchema>;

const nextActionFields = {
  next_action_date: optionalDate,
  next_action_text: optionalText(200, 'La acción admite hasta 200 caracteres.'),
};

export const opportunitySchema = z
  .object({
    id: uuid('Identificador no válido.').optional(),
    customer_id: uuid('Elige un cliente.'),
    title: titleField,
    type: z.enum(OPPORTUNITY_TYPES, { error: 'Elige el tipo.' }),
    estimated_amount: amount(true),
    stage: z.enum(OPEN_STAGES, { error: 'Elige la etapa.' }).default('nueva'),
    ...nextActionFields,
    notes: optionalText(2000, 'Las notas admiten hasta 2000 caracteres.'),
  })
  .superRefine(requireNextActionPair);

/** Edición: el cliente no cambia, y una oportunidad cerrada no lleva etapa ni próxima acción. */
export const opportunityEditSchema = z
  .object({
    title: titleField,
    type: z.enum(OPPORTUNITY_TYPES, { error: 'Elige el tipo.' }),
    estimated_amount: amount(true),
    stage: z.enum(OPEN_STAGES, { error: 'Elige la etapa.' }).optional(),
    next_action_date: optionalDate.optional(),
    next_action_text: optionalText(200, 'La acción admite hasta 200 caracteres.').optional(),
    notes: optionalText(2000, 'Las notas admiten hasta 2000 caracteres.'),
  })
  .superRefine(requireNextActionPair);

/** La próxima acción lleva siempre fecha y texto juntos (o ninguno). */
function requireNextActionPair(
  value: { next_action_date?: string | null; next_action_text?: string | null },
  ctx: z.RefinementCtx,
) {
  const hasDate = Boolean(value.next_action_date);
  const hasText = Boolean(value.next_action_text);
  if (hasDate && !hasText) ctx.addIssue({ code: 'custom', path: ['next_action_text'], message: 'Escribe qué hay que hacer.' });
  if (hasText && !hasDate) ctx.addIssue({ code: 'custom', path: ['next_action_date'], message: 'Elige la fecha de la próxima acción.' });
}

export const nextActionSchema = z.object({
  next_action_date: isoDate('Elige la fecha de la próxima acción.'),
  next_action_text: text(200, 'La acción admite hasta 200 caracteres.').min(1, 'Escribe qué hay que hacer.'),
});

export const closeWonSchema = z.object({
  final_amount: amount(false),
  closed_on: isoDate('Elige la fecha de cierre.'),
});

export const closeLostSchema = z.object({
  lost_reason: z.enum(LOST_REASONS, { error: 'Elige un motivo.' }),
  closed_on: isoDate('Elige la fecha de cierre.'),
});

export const reopenSchema = z.object({ stage: z.enum(OPEN_STAGES, { error: 'Elige la etapa.' }) });

export const activitySchema = z.object({
  id: uuid('Identificador no válido.').optional(),
  customer_id: uuid('Cliente no válido.'),
  opportunity_id: z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(uuid('Oportunidad no válida.').optional()),
  type: z.enum(ACTIVITY_TYPES, { error: 'Elige el tipo.' }),
  description: text(2000, 'La descripción admite hasta 2000 caracteres.').min(1, 'Escribe qué pasó.'),
  occurred_at: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === '') return null; // la base usa "ahora"
      const iso = localInputToIso(value);
      if (!iso) {
        ctx.issues.push({ code: 'custom', message: 'Escribe una fecha y hora válidas.', input: value });
        return z.NEVER;
      }
      return iso;
    }),
});

export const idSchema = z.object({ id: uuid('Identificador no válido.') });
export const ownerSchema = z.object({ id: uuid('Identificador no válido.'), owner_id: uuid('Elige un vendedor.') });

export const userCreateSchema = z.object({
  full_name: text(120, 'El nombre es demasiado largo.').min(2, 'Escribe el nombre completo.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200, 'Escribe un correo válido.')
    .refine((v) => EMAIL.test(v), 'Escribe un correo válido.'),
  role: z.enum(['vendedor', 'supervisor'], { error: 'Elige el rol.' }),
});

export const userActiveSchema = z.object({
  id: uuid('Identificador no válido.'),
  active: z.enum(['true', 'false']).transform((v) => v === 'true'),
});

const MAX_BULK_CUSTOMERS = 2000;
export const bulkReassignSchema = z
  .object({
    origin_id: uuid('Elige el vendedor de origen.'),
    dest_id: uuid('Elige el vendedor de destino.'),
    customer_ids: z.array(uuid('Cliente no válido.')).min(1, 'Elige al menos un cliente.').max(MAX_BULK_CUSTOMERS, 'Son demasiados clientes a la vez.'),
  })
  .refine((v) => v.origin_id !== v.dest_id, { path: ['dest_id'], message: 'El destino debe ser otro vendedor.' });
