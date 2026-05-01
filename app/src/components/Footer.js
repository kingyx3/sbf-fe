import React from "react";
import { envVars } from "../config/envConfig";

const Footer = ({ isDarkMode, footerRef }) => {
  return (
    <footer
      ref={footerRef}
      className="w-full bg-gray-900 border-t border-gray-700/60 text-gray-400 py-5 relative z-20"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()}{" "}
            <span className="text-gray-400 font-medium">{envVars.REACT_APP_NAME}</span>
            . All Rights Reserved.
          </p>
          <nav className="flex items-center gap-1">
            {[
              { href: "/privacy-policy", label: "Privacy" },
              { href: "/terms-of-service", label: "Terms" },
              { href: "/contact", label: "Contact" },
            ].map(({ href, label }, i, arr) => (
              <React.Fragment key={href}>
                <a
                  href={href}
                  className="text-xs text-gray-500 hover:text-gray-200 transition-colors duration-150 px-2 py-1 rounded hover:bg-gray-800"
                >
                  {label}
                </a>
                {i < arr.length - 1 && (
                  <span className="text-gray-700 select-none">·</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
