export interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(password: string): PasswordValidation {
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return {
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
}

export const PASSWORD_RULES = [
  { key: 'hasMinLength', label: `Au moins ${PASSWORD_MIN_LENGTH} caractères` },
  { key: 'hasUppercase', label: 'Une lettre majuscule' },
  { key: 'hasLowercase', label: 'Une lettre minuscule' },
  { key: 'hasNumber', label: 'Un chiffre' },
  { key: 'hasSpecialChar', label: 'Un caractère spécial (!@#$%...)' },
] as const;
