import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { FiSettings, FiSun, FiMoon, FiLogOut, FiShield } from "react-icons/fi";
import { auth } from "../config/firebaseConfig";
import { envVars } from "../config/envConfig";
import { useAdminAuth } from "../hooks/useAdminAuth";

const Navbar = ({ userEmail, isDarkMode, toggleDarkMode }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isAdmin } = useAdminAuth();

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-200 shadow-lg z-[9999]">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* App Logo & Name */}
        <div className="flex items-center">
          <img src="/favicon-32x32.png" alt="SBFHERO Logo" className="h-8 w-8 mr-2" /> {/* Replace 'logo.png' with your asset */}
          <h1 className="text-2xl font-bold">
            <Link to="/" className="hover:text-gray-400 transition-colors">
              {envVars.REACT_APP_NAME}
            </Link>
          </h1>
        </div>

        {/* Navigation Links & Settings */}
        <div className="flex items-center space-x-4">
          {/* Admin Link */}
          {isAdmin && (
            <Link
              to="/business"
              className="flex items-center px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <FiShield className="mr-2" size={16} />
              Admin
            </Link>
          )}

          {/* Settings Dropdown */}
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, setIsDropdownOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="focus:outline-none hover:text-gray-400 transition-colors"
      >
        <FiSettings size={24} />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
          {userEmail && (
            <div className="px-4 py-3 border-b dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Logged in as:
              </p>
              <p className="font-semibold truncate">{userEmail}</p>
            </div>
          )}

          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isDarkMode ? <FiSun className="mr-2" /> : <FiMoon className="mr-2" />}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>

          {userEmail && (
            <button
              onClick={() => {
                signOut(auth);
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiLogOut className="mr-2" />
              Logout
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
