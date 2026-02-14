/**
 * Normalization utilities for town names and flat types
 * Used across the application to ensure consistent data representation
 */

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
  const jurongVariants = ["Jurong East", "Jurong West", "Jurong East/ West", "Jurong East / West"];
  if (jurongVariants.includes(value)) {
    return "Jurong East / West";
  }
  
  // Normalize Kallang/Whampoa
  if (value === "Kallang/Whampoa") {
    return "Kallang Whampoa";
  }
  
  // Normalize Central Area
  if (value === "Central Area") {
    return "Central";
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
