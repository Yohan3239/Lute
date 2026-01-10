// Get the user's timezone from settings or default to system timezone
export function getUserTimezone(): string {
  const raw = localStorage.getItem("settings");
  if (!raw) return Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  try {
    const parsed = JSON.parse(raw);
    return parsed.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

// Get today's date string in YYYY-MM-DD format based on user's timezone
export function getTodayString(): string {
  const timezone = getUserTimezone();
  const now = new Date();
  
  // Format date in user's timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  return formatter.format(now); // Returns YYYY-MM-DD
}

// Get formatted date for display
export function getFormattedDate(): string {
  const timezone = getUserTimezone();
  const now = new Date();
  
  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);
}

// Format a given timestamp (ms) in user's timezone for display
export function formatDateMs(ts: number): string {
  const timezone = getUserTimezone();
  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(ts));
}

// Check if two date strings are consecutive days (for streak calculation)
export function isConsecutiveDay(lastDate: string, currentDate: string): boolean {
  const last = new Date(lastDate + "T00:00:00");
  const current = new Date(currentDate + "T00:00:00");
  const diffMs = current.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays === 1;
}
