import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import { envVars } from "./config/envConfig";
import queryClient from "./config/queryClient";
import { useAuth } from "./hooks/useAuth";
import { useDarkMode } from "./hooks/useDarkMode";

// Lazy load screens for code splitting
const LoginScreen = React.lazy(() => import("./screens/LoginScreen"));
const HomeScreen = React.lazy(() => import("./screens/HomeScreen"));
const AdminDashboard = React.lazy(() => import("./screens/AdminDashboard"));
const PrivacyPolicyScreen = React.lazy(() => import("./screens/PrivacyPolicyScreen"));
const TermsOfServiceScreen = React.lazy(() => import("./screens/TermsOfServiceScreen"));
const ContactUsScreen = React.lazy(() => import("./screens/ContactUsScreen"));
const PaymentSuccessScreen = React.lazy(() => import("./screens/PaymentSuccessScreen"));
const PaymentFailureScreen = React.lazy(() => import("./screens/PaymentFailureScreen"));

function App() {
  const { user, loading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // useEffect(() => {
  //   if (navigator.webdriver || /HeadlessChrome/.test(navigator.userAgent)) {
  //     window.location.href = "/error";
  //   }
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout userEmail={user?.email} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {envVars.testMode ? (
                  <>
                    <Route path="/" element={<Navigate to="/home" />} />
                    <Route path="/home" element={<HomeScreen isDarkMode={isDarkMode} />} />
                    <Route path="/business" element={<AdminDashboard isDarkMode={isDarkMode} />} />
                  </>
                ) : (
                  <>
                    {/* Public Routes */}
                    <Route path="/" element={user ? <Navigate to="/home" /> : <LoginScreen isDarkMode={isDarkMode} />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyScreen isDarkMode={isDarkMode} />} />
                    <Route path="/terms-of-service" element={<TermsOfServiceScreen isDarkMode={isDarkMode} />} />
                    <Route path="/contact" element={<ContactUsScreen isDarkMode={isDarkMode} />} />

                    {/* Protected Routes */}
                    <Route
                      path="/home"
                      element={
                        <ProtectedRoute user={user}>
                          <HomeScreen isDarkMode={isDarkMode} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/business"
                      element={
                        <AdminRoute>
                          <AdminDashboard isDarkMode={isDarkMode} />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/payment-success"
                      element={
                        <ProtectedRoute user={user}>
                          <PaymentSuccessScreen />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payment-failure"
                      element={
                        <ProtectedRoute user={user}>
                          <PaymentFailureScreen />
                        </ProtectedRoute>
                      }
                    />
                  </>
                )}
              </Routes>
            </Suspense>
          )}
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;




// Commands to manually deploy 

// DEV:
// Front-end (app/): 
// - $env:REACT_APP_NODE_ENV="development"; npm run build; firebase use sbfhero-dev; firebase deploy --only hosting
// Back-end (server/functions/):
// - npm install; firebase use dev; firebase deploy

// PROD:
// Front-end (app/): 
// - $env:REACT_APP_NODE_ENV="production"; npm run build; firebase use sbfhero-92c25; firebase deploy --only hosting
// Back-end (server/functions/):
// - npm install; firebase use prod; firebase deploy