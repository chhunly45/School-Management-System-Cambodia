const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (value: number): string => String(value).padStart(2, '0');

const isValidDate = (date: Date): boolean => Number.isFinite(date.getTime());

const formatLocalDateParts = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const formatLocalDateTimeParts = (date: Date): string =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}`;

const parseDateOnlyString = (value: string): Date | null => {
  const match = DATE_ONLY_PATTERN.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const resolveLocalDate = (value: Date | string | null | undefined): Date | null => {
  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    return parseDateOnlyString(trimmed);
  }

  const date = new Date(trimmed);
  return isValidDate(date) ? date : null;
};

/**
 * Format a date value for an HTML `<input type="date">`.
 *
 * Uses local year/month/day values and never relies on `toISOString()`.
 *
 * @param value - Date object, local YYYY-MM-DD string, null, or undefined
 * @returns YYYY-MM-DD or '' when invalid
 */
export const formatDateForInput = (
  value: Date | string | null | undefined
): string => {
  const date = resolveLocalDate(value);
  return date ? formatLocalDateParts(date) : '';
};

/**
 * Format a date value for API payloads.
 *
 * Returns a local YYYY-MM-DD string or null when the input is empty/invalid.
 *
 * @param value - Date object, local YYYY-MM-DD string, null, or undefined
 * @returns YYYY-MM-DD or null
 */
export const formatDateForApi = (
  value: Date | string | null | undefined
): string | null => {
  const formatted = formatDateForInput(value);
  return formatted === '' ? null : formatted;
};

/**
 * Format a date value for Cambodian display.
 *
 * Returns DD/MM/YYYY or "-" when empty/invalid.
 *
 * @param value - Date object, local YYYY-MM-DD string, null, or undefined
 */
export const formatDateForDisplay = (
  value: Date | string | null | undefined
): string => {
  const date = resolveLocalDate(value);
  if (!date) {
    return '-';
  }

  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

/**
 * Format a date/time value for display.
 *
 * Returns DD/MM/YYYY HH:mm or "-" when empty/invalid.
 *
 * @param value - Date object, local YYYY-MM-DD string, null, or undefined
 */
export const formatDateTimeForDisplay = (
  value: Date | string | null | undefined
): string => {
  const date = resolveLocalDate(value);
  if (!date) {
    return '-';
  }

  return formatLocalDateTimeParts(date);
};

/**
 * Parse a local YYYY-MM-DD string into a Date object.
 *
 * The returned Date represents midnight in local time and does not apply timezone shifts.
 *
 * @param value - YYYY-MM-DD string
 * @returns Date or null when invalid
 */
export const parseLocalDate = (value: string): Date | null => parseDateOnlyString(value);
