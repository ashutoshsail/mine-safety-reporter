import { format, parseISO } from 'date-fns';

/**
 * Formats a date string (e.g., '2025-08-17') into dd/MM/yyyy format.
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date, or 'Invalid Date' if the input is invalid.
 */
export const formatDate = (dateString) => {
  try {
    // parseISO is robust and handles date-only strings correctly
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};