// utils/phoneFormatUtils.js
// Utility function to format a phone number as (xxx)-xxx-xxxx

/**
 * Formats a string of digits as (xxx)-xxx-xxxx.
 * Non-digit characters are stripped before formatting.
 * If input is not 10 digits, returns the original input.
 * @param {string} input - The phone number string to format
 * @returns {string} - Formatted phone number or original input
 */
export function formatPhoneNumber(input) {
  if (!input) return "";
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)})-${digits.slice(3)}`;
  return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function unFormatPhoneNumber(text) {
  return text.replace(/\D/g, "").slice(0, 10);
}
