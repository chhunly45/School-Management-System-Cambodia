const { normalizeCambodiaPhone, phoneSearchVariants } = require('../utils/phone');

test('normalize various cambodia formats to E.164', () => {
  expect(normalizeCambodiaPhone('0968710886')).toBe('+855968710886');
  expect(normalizeCambodiaPhone('968710886')).toBe('+855968710886');
  expect(normalizeCambodiaPhone('+855968710886')).toBe('+855968710886');
  expect(normalizeCambodiaPhone('855968710886')).toBe('+855968710886');
  expect(normalizeCambodiaPhone('096 871 0886')).toBe('+855968710886');
  expect(normalizeCambodiaPhone('+855 96 871 0886')).toBe('+855968710886');
});

test('phoneSearchVariants returns expected variants', () => {
  const variants = phoneSearchVariants('0968710886');
  expect(variants).toContain('+855968710886');
  expect(variants).toContain('855968710886');
  expect(variants).toContain('968710886');
  expect(variants).toContain('0968710886');
});
