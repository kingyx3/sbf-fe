import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Main Component
const PaymentSuccessScreen = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          navigate("/home");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <Container>
      <Message>🎉 Payment Successful!</Message>
      <SubMessage>
        Redirecting you to your dashboard in <strong>{countdown}</strong> seconds...
      </SubMessage>
      <RedirectButton onClick={() => navigate("/home")}>
        Go to Dashboard Now
      </RedirectButton>
    </Container>
  );
};

// Reusable Components
const Container = ({ children }) => (
  <div className="flex flex-col items-center justify-center md:justify-start h-screen text-center bg-gray-50 dark:bg-gray-900 pt-20 md:pt-32">
    {children}
  </div>
);

const Message = ({ children }) => (
  <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
    {children}
  </h1>
);

const SubMessage = ({ children }) => (
  <p className="text-lg text-gray-700 dark:text-gray-300 mt-4">
    {children}
  </p>
);

const RedirectButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="mt-6 px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
  >
    {children}
  </button>
);

export default PaymentSuccessScreen;