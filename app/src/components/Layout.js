import React, { useRef } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children, userEmail, isDarkMode, toggleDarkMode }) => {
  const footerRef = useRef(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 select-none"
      // onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}>
      {/* Navbar - Fixed at Top */}
      <Navbar userEmail={userEmail} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main Content */}
      <main
        className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20"
      >
        {/* Pass children without footer state */}
        {children}
      </main>

      {/* Footer - Static positioning to stay below content */}
      <Footer isDarkMode={isDarkMode} footerRef={footerRef} />
    </div>
  );
};

export default Layout;
