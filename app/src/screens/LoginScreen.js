import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { envVars } from "../config/envConfig";
import { logLoginAttempt, logLoginSuccess, logLoginFailure } from "../utils/loginEventLogger";

const actionCodeSettings = {
  url: envVars.WEB_URL,
  handleCodeInApp: true,
  linkDomain: envVars.WEB_DOMAIN,
};

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/home");
    });

    if (isSignInWithEmailLink(auth, window.location.href)) {
      let storedEmail = window.localStorage.getItem("emailForSignIn");
      if (!storedEmail) {
        storedEmail = prompt("Please provide your email for confirmation:");
        if (!storedEmail) {
          setError("Email is required to complete sign-in.");
          return;
        }
      }

      signInWithEmailLink(auth, storedEmail, window.location.href)
        .then(async (result) => {
          // Log successful email link sign-in
          await logLoginSuccess(result.user.uid, result.user.email, 'email_link');
          window.localStorage.removeItem("emailForSignIn");
          navigate("/home");
        })
        .catch(async (error) => {
          // Log failed email link sign-in
          await logLoginFailure(storedEmail, 'email_link', error);
          setError("Error signing in: " + error.message);
          console.error("Sign-in error:", error);
        });
    }

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (error || message) {
      const timer = setTimeout(() => {
        setError("");
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, message]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCooldown(false);
    }
  }, [countdown]);

  const sendSignInEmail = async () => {
    if (cooldown) return;

    if (!email || !validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Log login attempt
      await logLoginAttempt(email, 'email_link');
      
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setMessage("Kindly check your inbox or spam/junk for the sign-in link.");
      setCooldown(true);
      setCountdown(30);
    } catch (error) {
      // Log login failure
      await logLoginFailure(email, 'email_link', error);
      setError("Error sending email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // Log login attempt
      await logLoginAttempt('google_oauth_user', 'google_oauth');
      
      const result = await signInWithPopup(auth, provider);
      // Log successful login
      await logLoginSuccess(result.user.uid, result.user.email, 'google_oauth');
      navigate("/home");
    } catch (popupError) {
      console.warn("Popup failed, trying redirect", popupError);
      try {
        const result = await signInWithRedirect(auth, provider);
        if (result) {
          // Log successful login
          await logLoginSuccess(result.user.uid, result.user.email, 'google_oauth');
          navigate("/home");
        }
      } catch (redirectError) {
        // Log login failure
        await logLoginFailure('google_oauth_user', 'google_oauth', redirectError);
        setError("Google sign-in failed: " + redirectError.message);
        console.error("Google redirect error:", redirectError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative flex flex-col items-center justify-start text-gray-800 dark:text-gray-200 px-4 pt-16 pb-8">
          {/* Main Hero Content */}
          <div className="text-center mb-12 max-w-4xl">
            <div className="mb-6">
              <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-300 bg-clip-text text-transparent leading-tight">
                Master Singapore's
                <br />
                <span className="text-4xl md:text-5xl">SBF Market</span>
              </h1>
            </div>
            
            <p className="mt-6 text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Transform your HDB Sale of Balance Flats journey with 
              <span className="font-semibold text-blue-600 dark:text-blue-400"> real-time insights</span>, 
              <span className="font-semibold text-purple-600 dark:text-purple-400"> smart analytics</span>, and 
              <span className="font-semibold text-green-600 dark:text-green-400"> data-driven decisions</span>
            </p>
          </div>

          {/* Login Card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 dark:opacity-40"></div>
            
            <div className="relative bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Join SBFHERO Today</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Start your smart property journey</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendSignInEmail();
                }}
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mb-4"
                />

                <Button type="submit" disabled={loading || cooldown} className="mb-4">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Magic Link...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🚀</span>
                      Continue with Email
                    </div>
                  )}
                </Button>
              </form>

              {message && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                  <p className="text-green-700 dark:text-green-400 font-medium">
                    <span className="mr-2">📧</span>
                    {message}
                  </p>
                </div>
              )}

              {cooldown && (
                <p className="text-gray-500 dark:text-gray-400 text-center mt-2 text-sm">
                  ⏱️ You can resend in {countdown}s
                </p>
              )}

              {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                  <p className="text-red-700 dark:text-red-400 font-medium">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="mt-6">
                <div className="relative text-center my-4">
                  <hr className="border-gray-300 dark:border-gray-600" />
                  <span className="absolute left-1/2 transform -translate-x-1/2 -top-3 bg-white dark:bg-gray-800 px-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    or
                  </span>
                </div>

                <Button 
                  onClick={handleGoogleSignIn} 
                  disabled={loading}
                  variant="secondary"
                  className="flex items-center justify-center bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-gray-200 mr-2"></div>
                      Connecting...
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M23.7663 12.2764C23.7663 11.4607 23.7001 10.6406 23.559 9.83807H12.2402V14.4591H18.722C18.453 15.9494 17.5888 17.2678 16.3233 18.1056V21.1039H20.1903C22.4611 19.0139 23.7663 15.9274 23.7663 12.2764Z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3276 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.50277 14.3003C5.00011 12.8099 5.00011 11.1961 5.50277 9.70575V6.61481H1.51674C-0.185266 10.0056 -0.185266 14.0004 1.51674 17.3912L5.50277 14.3003Z"
                          fill="#FBBC04"
                        />
                        <path
                          d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>

                {/* Security note */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                  🔒 Your data is secure and protected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="mt-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Why SBFHERO is Singapore's #1 SBF Platform
          </h3>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Join thousands of smart property buyers who made successful SBF decisions with our platform
          </p>
        </div>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="📊"
            title="Live Market Data"
            description="Access real-time SBF pricing, availability, and market trends updated every hour"
            color="blue"
          />
          <FeatureCard
            icon="🔍"
            title="Advanced Analytics"
            description="Filter by location, pricing, TOP dates, and 20+ criteria to discover hidden gems"
            color="green"
          />
          <FeatureCard
            icon="🎯"
            title="Price Prediction"
            description="AI-powered insights predict future price trends and optimal buying windows"
            color="orange"
          />
        </div>

        {/* Social Proof Section */}
        <div className="mt-16 text-center">
          <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Trusted by Smart Property Buyers
          </h4>
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">2,500+</div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Successful SBF Purchases</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">$2.5B+</div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Property Value Analyzed</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">98%</div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">User Satisfaction Rate</p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600">
            <div className="text-center">
              <div className="text-2xl mb-4">⭐⭐⭐⭐⭐</div>
              <blockquote className="text-xl text-gray-700 dark:text-gray-300 font-medium italic mb-6">
                "SBFHERO helped me find the perfect 4-room flat in Tampines. The data insights saved me months of research and $30K compared to other options!"
              </blockquote>
              <div className="flex items-center justify-center">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Sarah Lim</p>
                  <p className="text-gray-600 dark:text-gray-400">First-time SBF Buyer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center pb-12">
          <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Ready to Make Your Best SBF Decision?
          </h4>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join our community of successful property buyers. Start your journey with instant access to Singapore's most comprehensive SBF database.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              No credit card required
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Instant access
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

// Reusable Components
const FeatureCard = ({ icon, title, description, color = "blue" }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500",
    purple: "from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500",
    green: "from-green-500 to-green-600 dark:from-green-400 dark:to-green-500",
    orange: "from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500",
    pink: "from-pink-500 to-pink-600 dark:from-pink-400 dark:to-pink-500",
    indigo: "from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500"
  };

  const iconBgClasses = {
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
    pink: "bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400",
    indigo: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r opacity-20 group-hover:opacity-40 transition duration-300 blur"></div>
      <div className="relative bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
        <div className={`inline-flex p-3 rounded-lg ${iconBgClasses[color]} mb-4`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {title}
        </h4>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const Input = ({ type, value, onChange, placeholder, className }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${className}`}
  />
);

const Button = ({ onClick, disabled, children, className = "", type = "button", variant = "primary" }) => {
  const baseClasses = "w-full p-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center transform hover:scale-105 active:scale-95";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md hover:shadow-lg",
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed transform-none hover:scale-100" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
};
