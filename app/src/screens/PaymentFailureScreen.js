import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Main Component
const PaymentFailureScreen = () => {
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
      <Message>❌ Payment Failed</Message>
      <SubMessage>
        Something went wrong with your payment. Please try again.
      </SubMessage>
      <CountdownText>
        Redirecting to home in <strong>{countdown}</strong> seconds...
      </CountdownText>
      <ButtonContainer>
        <HomeButton onClick={() => navigate("/home")}>Back to Home</HomeButton>
      </ButtonContainer>
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
  <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">
    {children}
  </h1>
);

const SubMessage = ({ children }) => (
  <p className="text-lg text-gray-700 dark:text-gray-300 mt-4">
    {children}
  </p>
);

const CountdownText = ({ children }) => (
  <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
    {children}
  </p>
);

const ButtonContainer = ({ children }) => (
  <div className="mt-6 flex gap-4">
    {children}
  </div>
);

const HomeButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
  >
    {children}
  </button>
);

export default PaymentFailureScreen;