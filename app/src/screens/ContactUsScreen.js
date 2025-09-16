import React, { useState } from "react";
import { functions } from "../config/firebaseConfig";
import { httpsCallable } from "firebase/functions";

// Main Component
const ContactUsScreen = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "General Inquiry",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const categories = [
    "General Inquiry",
    "Partnerships",
    "Bug Report",
    "Feature Request",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate email field
    if (name === "email") {
      validateEmail(value);
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email regex
    if (!regex.test(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  // Check if all fields are filled and valid
  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      !emailError && // Ensure email is valid
      formData.category.trim() &&
      formData.message.trim()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading state to true

    // Frontend validation
    if (!isFormValid()) {
      setStatus("Please fill in all fields correctly.");
      setIsLoading(false); // Reset loading state
      return;
    }

    try {
      const submitFeedback = httpsCallable(functions, "submitFeedback");
      await submitFeedback(formData);

      setStatus("Your message has been sent successfully.");
      setFormData({
        name: "",
        email: "",
        category: "General Inquiry",
        message: "",
      });
      setEmailError(""); // Clear email error on success
    } catch (error) {
      setStatus("Error sending message. Please try again later. " + error);
      console.error("Error submitting contact form:", error);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <Container>
      <Title>Contact Us</Title>
      <Paragraph>
        Have a question or need assistance? Fill out the form below and we'll get
        back to you as soon as possible.
      </Paragraph>

      <Form onSubmit={handleSubmit}>
        <InputField
          label="Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <InputField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          error={emailError}
        />
        <SelectField
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={categories}
          required
        />
        <TextareaField
          label="Message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
        />
        <SubmitButton type="submit" disabled={!isFormValid() || isLoading}>
          {isLoading ? "Submitting..." : "Send Message"}
        </SubmitButton>
        {status && <StatusMessage status={status} />}
      </Form>
    </Container>
  );
};

// Reusable Components
const Container = ({ children }) => (
  <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    {children}
  </div>
);

const Title = ({ children }) => (
  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-4">
    {children}
  </h2>
);

const Paragraph = ({ children }) => (
  <p className="text-gray-600 dark:text-gray-400 mb-6">{children}</p>
);

const Form = ({ onSubmit, children }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {children}
  </form>
);

const InputField = ({ label, type, name, value, onChange, required, error }) => (
  <div>
    <Label htmlFor={name}>
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`mt-1 p-2 w-full border ${error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
        } rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    />
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required }) => (
  <div>
    <Label htmlFor={name}>
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 p-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const TextareaField = ({ label, name, value, onChange, required }) => (
  <div>
    <Label htmlFor={name}>
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 p-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      rows="4"
    />
  </div>
);

const Label = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
  >
    {children}
  </label>
);

const SubmitButton = ({ children, disabled, ...props }) => (
  <div className="flex justify-center"> {/* Centering wrapper */}
    <button
      {...props}
      disabled={disabled}
      className={`w-full sm:w-64 ${disabled
        ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
        : "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800"
        } text-white py-2 px-4 rounded-md transition-colors`}
    >
      {children}
    </button>
  </div>
);

const StatusMessage = ({ status }) => (
  <p
    className={`mt-4 text-sm text-center ${status.includes("Error") ? "text-red-600" : "text-green-600"
      }`}
  >
    {status}
  </p>
);

export default ContactUsScreen;