/**
 * Timezone utilities for IST (Indian Standard Time) ↔ UTC conversion
 * 
 * All dates from server are in UTC ISO format.
 * Users input times in IST (assumed as local context).
 * 
 * IST = UTC + 5:30 (no daylight saving)
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 19,800,000ms (5 hours 30 minutes)
const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Convert IST datetime-local input to UTC ISO string for API
 * 
 * User selects in IST: "2026-08-01T10:30" (10:30 AM IST)
 * Result: "2026-08-01T05:00:00.000Z" (5:00 AM UTC, after subtracting 5.5 hours)
 * 
 * @param {string} istDateTimeString - Format from datetime-local input: "YYYY-MM-DDTHH:mm"
 * @returns {string|null} UTC ISO string or null if invalid
 */
export const convertISTtoUTC = (istDateTimeString) => {
  if (!istDateTimeString) return null;

  // Parse the datetime-local string explicitly (format: "2026-08-01T10:30")
  const [datePart, timePart] = istDateTimeString.split('T');
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  if (!year || !month || !day || hours === undefined || minutes === undefined) return null;

  // Create a Date using UTC constructor with the parsed values
  // This treats the datetime as if it's UTC (we'll adjust in next step)
  const dateAsUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  // Now subtract 5.5 hours to convert IST → UTC
  // User selected 10:30 IST → we need 05:00 UTC
  const utcTime = new Date(dateAsUTC.getTime() - IST_OFFSET_MS);
  
  return utcTime.toISOString();
};

/**
 * Format UTC date/datetime for display in IST timezone
 * 
 * API returns "2026-08-01T05:00:00.000Z" (UTC)
 * Result: "1/8/2026, 10:30:00 AM" (formatted in IST)
 * 
 * @param {string|Date} date - ISO string or Date object from API
 * @returns {string} Formatted date in IST timezone
 */
export const formatDateIST = (date) => {
  if (!date) return '';

  const parsed = new Date(date);

  // Validate the date
  if (isNaN(parsed.getTime())) return '';
  // Use Intl to get components in IST timezone, then build a clear format.
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = fmt.formatToParts(parsed).reduce((acc, p) => {
    if (p.type && p.value) acc[p.type] = p.value;
    return acc;
  }, {});

  const day = parts.day || '00';
  const month = parts.month || '00';
  const year = parts.year || '0000';
  const hour24 = parts.hour || '00';
  const minute = parts.minute || '00';
  const second = parts.second || '00';

  // Determine AM/PM based on 24-hour hour in IST
  const hourNum = Number(hour24);
  const ampm = (!isNaN(hourNum) && hourNum >= 12) ? 'PM' : 'AM';

  // Format: DD/MM/YYYY, HH:mm:ss AM/PM (24-hour number with AM/PM appended)
  return `${day}/${month}/${year}, ${hour24}:${minute}:${second} ${ampm}`;
};
