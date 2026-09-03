const TIME_TEXT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DEFAULT_SCHOOL_TIMEZONE = 'Asia/Phnom_Penh';

const getSchoolTimezone = () => process.env.SCHOOL_TIMEZONE || DEFAULT_SCHOOL_TIMEZONE;

const getZonedParts = (dateValue, timeZone = getSchoolTimezone()) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  return { year: values.year, month: values.month, day: values.day, hour: values.hour, minute: values.minute, second: values.second };
};

const getTimeZoneOffsetMs = (dateValue, timeZone = getSchoolTimezone()) => {
  const parts = getZonedParts(dateValue, timeZone);
  if (!parts) return null;
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - new Date(dateValue).getTime();
};

const zonedDateTimeToUtc = ({ year, month, day, hour = 0, minute = 0, second = 0 }, timeZone = getSchoolTimezone()) => {
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = getTimeZoneOffsetMs(new Date(localAsUtc), timeZone);
  if (offset === null) throw new Error('Invalid timezone');
  return new Date(localAsUtc - offset);
};

const getSchoolDayBounds = (dateValue, timeZone = getSchoolTimezone()) => {
  const parts = getZonedParts(dateValue, timeZone);
  if (!parts) throw new Error('Invalid date');
  const start = zonedDateTimeToUtc({ year: parts.year, month: parts.month, day: parts.day }, timeZone);
  const nextDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  const end = zonedDateTimeToUtc({ year: nextDay.getUTCFullYear(), month: nextDay.getUTCMonth() + 1, day: nextDay.getUTCDate() }, timeZone);
  return { start, end };
};

const normalizeToDayStart = (value) => {
  const input = new Date(value);
  if (Number.isNaN(input.getTime())) {
    const error = new Error('Invalid date');
    error.statusCode = 400;
    throw error;
  }

  const start = new Date(input);
  start.setHours(0, 0, 0, 0);
  return start;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseTimeToMinutes = (value) => {
  const text = String(value || '').trim();
  if (!TIME_TEXT_REGEX.test(text)) {
    return null;
  }

  const [hours, minutes] = text.split(':').map(Number);
  return (hours * 60) + minutes;
};

const getLocalMinutes = (dateValue, timeZone = getSchoolTimezone()) => {
  const parts = getZonedParts(dateValue, timeZone);
  return (parts.hour * 60) + parts.minute;
};

module.exports = {
  TIME_TEXT_REGEX,
  normalizeToDayStart,
  addDays,
  parseTimeToMinutes,
  getLocalMinutes,
  getSchoolTimezone,
  getZonedParts,
  zonedDateTimeToUtc,
  getSchoolDayBounds,
  DEFAULT_SCHOOL_TIMEZONE
};
