import React from "react";
import { envVars } from "../config/envConfig";

const Footer = ({ isDarkMode, footerRef }) => {
  return (
    <footer
      ref={footerRef} // Pass the ref from Layout.js
      className={`w-full bg-gray-800 ${isDarkMode ? "dark:bg-gray-900" : ""
        } text-white dark:text-gray-200 py-4 relative z-20`}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} {envVars.REACT_APP_NAME}. All Rights Reserved.
          </p>
          <div className="flex space-x-6">
            <a href="/privacy-policy" className="text-sm hover:text-gray-400 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="text-sm hover:text-gray-400 transition-colors">
              Terms of Service
            </a>
            <a href="/contact" className="text-sm hover:text-gray-400 transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
