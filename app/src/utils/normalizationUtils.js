/**
 * Normalization utilities for town names and flat types
 * Used across the application to ensure consistent data representation
 */

// Constants for normalization
const JURONG_VARIANTS = ["Jurong East", "Jurong West", "Jurong East/ West", "Jurong East / West"];
const NORMALIZED_JURONG = "Jurong East / West";
const KALLANG_VARIANT = "Kallang/Whampoa";
const NORMALIZED_KALLANG = "Kallang Whampoa";
const CENTRAL_AREA_VARIANT = "Central Area";
const NORMALIZED_CENTRAL = "Central";

/**
 * Normalizes town names to a consistent format
 * Handles various town name variations from supply and demand data
 * 
 * @param {string} value - The town name to normalize
 * @returns {string} The normalized town name
 * 
 * @example
 * normalizeGroupValue("Jurong East") // returns "Jurong East / West"
 * normalizeGroupValue("Jurong West") // returns "Jurong East / West"
 * normalizeGroupValue("Kallang/Whampoa") // returns "Kallang Whampoa"
 * normalizeGroupValue("Central Area") // returns "Central"
 */
export const normalizeGroupValue = (value) => {
  if (!value) return "";
  
  // Normalize Jurong variants (with and without space after slash)
  if (JURONG_VARIANTS.includes(value)) {
    return NORMALIZED_JURONG;
  }
  
  // Normalize Kallang/Whampoa
  if (value === KALLANG_VARIANT) {
    return NORMALIZED_KALLANG;
  }
  
  // Normalize Central Area
  if (value === CENTRAL_AREA_VARIANT) {
    return NORMALIZED_CENTRAL;
  }
  
  return value;
};

/**
 * Normalizes flat type/subgroup values to a consistent format
 * Converts certain flat types to their standard equivalents
 * 
 * @param {string} value - The flat type to normalize
 * @returns {string} The normalized flat type
 * 
 * @example
 * normalizeSubGroupValue("3Gen") // returns "5-room"
 * normalizeSubGroupValue("Executive") // returns "5-room"
 */
export const normalizeSubGroupValue = (value) => {
  if (!value) return "";
  // Use replaceAll to handle multiple occurrences
  return value.replaceAll("3Gen", "5-room").replaceAll("Executive", "5-room");
};
