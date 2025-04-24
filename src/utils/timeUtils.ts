export const getRelativeTime = (timestamp: string | Date): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  // Handle future dates
  if (seconds < 0) {
    return 'just now';
  }

  // Handle very recent posts
  if (seconds < 30) {
    return 'just now';
  }

  // Find the appropriate interval
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      // Handle plural forms
      const plural = interval > 1 ? 's' : '';
      return `${interval} ${unit}${plural} ago`; // e.g., '5 minutes ago', '2 hours ago', '3 days ago'
    }
  }

  return 'just now';
};