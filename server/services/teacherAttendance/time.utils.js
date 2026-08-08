const TIME_TEXT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

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

const getLocalMinutes = (dateValue) => {
  const date = new Date(dateValue);
  return (date.getHours() * 60) + date.getMinutes();
};

module.exports = {
  TIME_TEXT_REGEX,
  normalizeToDayStart,
  addDays,
  parseTimeToMinutes,
  getLocalMinutes
};
