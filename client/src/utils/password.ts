export type PasswordStrength = 'Weak' | 'Medium' | 'Strong' | '';

export const getPasswordStrength = (password = ''): PasswordStrength => {
  const trimmed = password || '';
  if (!trimmed) return '';

  const length = trimmed.length;
  const hasUppercase = /[A-Z]/.test(trimmed);
  const hasLowercase = /[a-z]/.test(trimmed);
  const hasNumber = /\d/.test(trimmed);
  const hasSpecial = /[^A-Za-z0-9]/.test(trimmed);
  const onlyLetters = /^[A-Za-z]+$/.test(trimmed);
  const onlyNumbers = /^\d+$/.test(trimmed);

  if (length < 8 || onlyLetters || onlyNumbers) {
    return 'Weak';
  }

  if (hasUppercase && hasLowercase && hasNumber && hasSpecial) {
    return 'Strong';
  }

  if ((hasLowercase || hasUppercase) && hasNumber) {
    return 'Medium';
  }

  return 'Weak';
};

export const getPasswordStrengthLabel = (strength: PasswordStrength): string => {
  if (strength === 'Strong') return 'ខ្លាំង';
  if (strength === 'Medium') return 'មធ្យម';
  if (strength === 'Weak') return 'ខ្សោយ';
  return '';
};
