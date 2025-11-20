import { format, parse } from 'date-fns';

/**
 * Formats a date string from YYYY-MM-DD to "Thurs. Nov. 20th, 2025"
 */
export function formatDisplayDate(dateString: string): string {
  try {
    const date = parse(dateString, 'yyyy-MM-dd', new Date());
    
    // Get the day with suffix (1st, 2nd, 3rd, 4th, etc.)
    const day = date.getDate();
    const suffix = getDaySuffix(day);
    
    // Format: "Thurs. Nov. 20th, 2025"
    const dayOfWeek = format(date, 'EEE');
    const month = format(date, 'MMM');
    const year = format(date, 'yyyy');
    
    return `${dayOfWeek}. ${month}. ${day}${suffix}, ${year}`;
  } catch (error) {
    // Fallback to original string if parsing fails
    return dateString;
  }
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
