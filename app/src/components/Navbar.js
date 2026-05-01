import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { FiSettings, FiSun, FiMoon, FiLogOut, FiShield, FiUser } from "react-icons/fi";
import { auth } from "../config/firebaseConfig";
import { envVars } from "../config/envConfig";
import { useAdminAuth } from "../hooks/useAdminAuth";

const Navbar = ({ userEmail, isDarkMode, toggleDarkMode }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isAdmin } = useAdminAuth();

  return (
    <nav className="fixed top-0 left-0 w-full z-[9999] bg-gray-900/95 backdrop-blur-md border-b border-gray-700/60 shadow-nav">
      <div className="container mx-auto flex justify-between items-center px-4 h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md group-hover:shadow-blue-500/30 transition-shadow duration-200">
            <img src="/favicon-32x32.png" alt="" className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors duration-200">
            {envVars.REACT_APP_NAME}
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/business"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/70 transition-all duration-150"
            >
              <FiShield size={14} />
              Admin
            </Link>
          )}

          <SettingsDropdown
            userEmail={userEmail}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
        </div>
      </div>
    </nav>
  );
};

const SettingsDropdown = ({
  userEmail,
  isDropdownOpen,
  setIsDropdownOpen,
  isDarkMode,
  toggleDarkMode,
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, setIsDropdownOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${
          isDropdownOpen
            ? "bg-blue-600 text-white"
            : "text-gray-300 hover:text-white hover:bg-gray-700/70"
        }`}
        aria-label="Settings"
      >
        <FiSettings size={17} className={isDropdownOpen ? "rotate-45" : ""} style={{ transition: "transform 0.2s" }} />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in z-10">
          {userEmail && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <FiUser size={14} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Signed in as</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{userEmail}</p>
                </div>
              </div>
            </div>
          )}

          <div className="py-1">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
            >
              {isDarkMode ? (
                <FiSun size={15} className="text-amber-500" />
              ) : (
                <FiMoon size={15} className="text-indigo-500" />
              )}
              <span>{isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
            </button>

            {userEmail && (
              <>
                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                <button
                  onClick={() => {
                    signOut(auth);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <FiLogOut size={15} />
                  <span>Sign out</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
