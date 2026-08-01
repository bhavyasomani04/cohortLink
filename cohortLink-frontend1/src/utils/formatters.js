import dayjs from 'dayjs';

/**
 * Format an ISO date string to a short month-day label, e.g. "OCT 14"
 */
export function formatEventDate(dateStr) {
  if (!dateStr) return '';
  return dayjs(dateStr).format('MMM D').toUpperCase();
}

/**
 * Format an ISO date string to a readable time, e.g. "6:00 PM"
 */
export function formatEventTime(dateStr) {
  if (!dateStr) return '';
  return dayjs(dateStr).format('h:mm A');
}

/**
 * Return initials from a name string (up to 2 letters).
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Generate a deterministic hue from a string for avatar backgrounds.
 */
export function stringToHue(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
