// Helpers for normalizing Cambodian phone numbers
const normalizeCambodiaPhone = (input) => {
  if (!input) return null;
  const s = input.toString();
  const digits = s.replace(/\D/g, '');
  if (!digits) return null;

  // If already starts with country code 855
  if (digits.startsWith('855')) {
    return `+${digits}`;
  }

  // If starts with 0 (local), remove leading zeros and prefix 855
  if (digits.startsWith('0')) {
    const local = digits.replace(/^0+/, '');
    return `+855${local}`;
  }

  // If it's short (like 968710886), assume it's local without leading zero
  if (digits.length === 8 || digits.length === 9) {
    return `+855${digits}`;
  }

  // Fallback: if it's full with country code but missing +, add +
  return `+${digits}`;
};

const phoneSearchVariants = (input) => {
  // Return array of possible stored phone values to search for (E.164, digits w/o +, local 0)
  const normalizedE164 = normalizeCambodiaPhone(input);
  if (!normalizedE164) return [];
  const digits = normalizedE164.replace(/^\+/, ''); // e.g. 855968710886
  const withoutCountry = digits.replace(/^855/, ''); // e.g. 968710886
  const localZero = `0${withoutCountry}`; // e.g. 0968710886

  return [
    normalizedE164, // +855968710886
    digits, // 855968710886
    withoutCountry, // 968710886
    localZero // 0968710886
  ];
};

module.exports = {
  normalizeCambodiaPhone,
  phoneSearchVariants
};
