import React from "react";
import { envVars } from "../../../app/src/config/envConfig";

const PrivacyPolicyScreen = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">
      <h2 className="text-3xl font-bold mb-6">Privacy Policy</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        At <strong>{envVars.REACT_APP_NAME}</strong>, we are committed to
        transparency about how we collect, use, and protect data. This Privacy
        Policy outlines our practices regarding data collection and usage.
      </p>

      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4">
        1. Information We Collect
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        a. <strong>Data Source(s):</strong> We collect and aggregate publicly
        available data from multiple sources to enhance our platform’s services.
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        b. <strong>Email for Authentication:</strong> We only collect and use
        email addresses to authenticate users on our platform.
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        c. <strong>Usage Data:</strong> We track interactions with our platform,
        such as access times, device details, and browsing patterns, to improve
        user experience.
      </p>

      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4">
        2. How We Use Your Information
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        a. <strong>Platform Functionality:</strong> We use data to provide and
        improve our services, ensuring accurate and efficient access to
        information.
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        b. <strong>Security and Fraud Prevention:</strong> We monitor activity to
        detect and prevent fraud, unauthorized access, and misuse.
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        c. <strong>Analytics and Performance:</strong> We analyze data trends to
        enhance our platform’s efficiency and effectiveness.
      </p>

      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4">
        3. Data Sharing and Disclosure
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        a. <strong>Third-Party Services:</strong> We may share data with
        analytics providers, security partners, and cloud hosting services to
        support platform operations.
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        b. <strong>Legal Compliance:</strong> We may disclose data if required by
        law or to protect our rights and interests.
      </p>

      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4">
        4. Data Security
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        We implement appropriate security measures to protect data from
        unauthorized access, alteration, or destruction. However, no method of
        transmission over the internet is 100% secure.
      </p>

      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4">
        5. Your Choices
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        a. <strong>Account Management:</strong> Please note that changing your email address is not currently supported.
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        b. <strong>Opt-Out:</strong> If you wish to stop using our services, you can delete your account at any time by contacting support.
      </p>

      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4">
        6. Changes to This Privacy Policy
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        We may update this Privacy Policy periodically. Any changes will be
        communicated through our platform or via email notifications.
      </p>

      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4">
        7. Contact Us
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        For any questions or concerns, please contact us at{" "}
        <a
          href={`mailto:${envVars.REACT_APP_SUPPORT_EMAIL}`}
          className="text-blue-600 dark:text-blue-400 underline"
        >
          {envVars.REACT_APP_SUPPORT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
};

export default PrivacyPolicyScreen;