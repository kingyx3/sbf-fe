import React from "react";
import { envVars } from "../../../app/src/config/envConfig";

// Main Component
const TermsOfServiceScreen = () => {
  return (
    <Container>
      <Title>Terms of Service</Title>
      <Paragraph>
        Welcome to <strong>{envVars.REACT_APP_NAME}</strong>. By accessing or
        using our platform, you agree to be bound by these Terms of Service. If
        you do not agree with any part of these terms, please do not use our
        services.
      </Paragraph>

      <SectionTitle>1. Acceptance of Terms</SectionTitle>
      <Paragraph>
        By using our platform, you acknowledge that you have read, understood,
        and agreed to these terms. These terms may be updated periodically, and
        continued use constitutes acceptance of any changes.
      </Paragraph>

      <SectionTitle>2. User Accounts</SectionTitle>
      <Paragraph>
        a. <strong>Registration:</strong> Users must provide a valid email
        address to create an account. You are responsible for maintaining the
        confidentiality of your login credentials.
      </Paragraph>
      <Paragraph>
        b. <strong>Account Security:</strong> You agree to notify us immediately
        of any unauthorized access or security breach related to your account.
      </Paragraph>
      <Paragraph>
        c. <strong>Termination:</strong> We reserve the right to suspend or
        terminate accounts that violate these terms or engage in unauthorized
        activities.
      </Paragraph>

      <SectionTitle>3. Use of Our Services</SectionTitle>
      <Paragraph>
        a. <strong>Permitted Use:</strong> You may only use our platform for
        lawful purposes and in accordance with these terms.
      </Paragraph>
      <Paragraph>
        b. <strong>Data Usage:</strong> We collect and use publicly available
        data from multiple sources to enhance our services. You agree not to
        misuse or misrepresent this information.
      </Paragraph>
      <Paragraph>
        c. <strong>Prohibited Activities:</strong> You may not engage in
        activities that:
      </Paragraph>
      <List>
        <ListItem>Violate laws or regulations</ListItem>
        <ListItem>Interfere with platform security</ListItem>
        <ListItem>Scrape or extract data without authorization</ListItem>
        <ListItem>Distribute malware or engage in fraudulent activities</ListItem>
      </List>

      <SectionTitle>4. Intellectual Property</SectionTitle>
      <Paragraph>
        All content, trademarks, and data available on our platform remain the
        property of <strong>{envVars.REACT_APP_NAME}</strong> or its respective
        owners. Unauthorized reproduction or distribution is strictly prohibited.
      </Paragraph>

      <SectionTitle>5. Disclaimer & Limitation of Liability</SectionTitle>
      <Paragraph>
        a. <strong>No Warranties:</strong> Our platform is provided "as is"
        without warranties of any kind. We do not guarantee accuracy,
        reliability, or availability of information.
      </Paragraph>
      <Paragraph>
        b. <strong>Limitation of Liability:</strong> Under no circumstances shall
        we be liable for indirect, incidental, or consequential damages resulting
        from the use of our services.
      </Paragraph>

      <SectionTitle>6. Governing Law</SectionTitle>
      <Paragraph>
        These terms shall be governed by and construed in accordance with the
        laws of Singapore. Any disputes shall be resolved in the
        applicable courts.
      </Paragraph>

      <SectionTitle>7. Changes to Terms</SectionTitle>
      <Paragraph>
        We may modify these Terms of Service at any time. We will notify users of
        significant changes through platform updates or email notifications.
      </Paragraph>

      <SectionTitle>8. Contact Us</SectionTitle>
      <Paragraph>
        If you have any questions about these terms, please contact us at{" "}
        <Link href={`mailto:${envVars.REACT_APP_SUPPORT_EMAIL}`}>
          {envVars.REACT_APP_SUPPORT_EMAIL}
        </Link>
        .
      </Paragraph>
    </Container>
  );
};

// Reusable Components
const Container = ({ children }) => (
  <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">
    {children}
  </div>
);

const Title = ({ children }) => (
  <h2 className="text-3xl font-bold mb-6">{children}</h2>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4">
    {children}
  </h3>
);

const Paragraph = ({ children }) => (
  <p className="text-gray-700 dark:text-gray-300 mb-6">{children}</p>
);

const List = ({ children }) => (
  <ul className="list-disc pl-8 text-gray-700 dark:text-gray-300 mb-6">
    {children}
  </ul>
);

const ListItem = ({ children }) => <li className="mb-2">{children}</li>;

const Link = ({ href, children }) => (
  <a
    href={href}
    className="text-blue-600 dark:text-blue-400 underline"
  >
    {children}
  </a>
);

export default TermsOfServiceScreen;