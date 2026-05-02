import React, { useRef } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children, userEmail, isDarkMode, toggleDarkMode }) => {
  const footerRef = useRef(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 select-none"
      onCopy={(e) => e.preventDefault()}>
      <Navbar userEmail={userEmail} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {children}
      </main>

      <Footer isDarkMode={isDarkMode} footerRef={footerRef} />
    </div>
  );
};

export default Layout;
