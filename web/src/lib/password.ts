// Política de contraseña (TECHNICAL_SPEC §6.1): mínimo 10 caracteres, con letras y números.
export const PASSWORD_MIN_LENGTH = 10;

export type PasswordChecks = { length: boolean; lettersAndNumbers: boolean };

export function checkPassword(value: string): PasswordChecks {
  return {
    length: value.length >= PASSWORD_MIN_LENGTH,
    lettersAndNumbers: /\p{L}/u.test(value) && /\p{N}/u.test(value),
  };
}

export function isStrongPassword(value: string): boolean {
  const checks = checkPassword(value);
  return checks.length && checks.lettersAndNumbers;
}
