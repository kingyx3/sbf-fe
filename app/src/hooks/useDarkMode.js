import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing dark mode state
 * @returns {Object} { isDarkMode, toggleDarkMode }
 */
export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode };
};