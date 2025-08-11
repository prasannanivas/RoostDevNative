// utils/stringUtils.js

/**
 * Trims leading whitespace from the provided text.
 * Safe for null/undefined values.
 * @param {string} text
 * @returns {string}
 */
export function trimLeft(text) {
  if (text == null) return "";
  return String(text).replace(/^\s+/, "");
}

/**
 * Trims leading and trailing whitespace from the provided text.
 * Safe for null/undefined values.
 * @param {string} text
 * @returns {string}
 */
export function trimFull(text) {
  if (text == null) return "";
  return String(text).trim();
}
