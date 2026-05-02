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
import { Button, Input, Divider, Badge } from "../components/ui";

const actionCodeSettings = {
  url: envVars.WEB_URL,
  handleCodeInApp: true,
  linkDomain: envVars.WEB_DOMAIN,
};

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Live Market Data",
    desc: "Real-time SBF pricing, availability, and demand updated hourly.",
    color: "blue",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
      </svg>
    ),
    title: "Smart Filters",
    desc: "20+ filter dimensions: location, price, MRT distance, lease, and more.",
    color: "purple",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: "ROI Analysis",
    desc: "Estimate potential resale returns and find the best value flats.",
    color: "green",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
    title: "Interactive Map",
    desc: "Visualise all available units on an interactive Singapore map.",
    color: "amber",
  },
];

const STATS = [
  { value: "20+", label: "Filter dimensions" },
  { value: "100%", label: "HDB SBF coverage" },
  { value: "Hourly", label: "Data refresh rate" },
];

const iconColors = {
  blue:   "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400",
  purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  green:  "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  amber:  "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
};

// ─── Google SVG logo ───────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M23.766 12.277c0-.816-.066-1.636-.207-2.438H12.24v4.619h6.482a5.547 5.547 0 01-2.392 3.641v3.003h3.865c2.271-2.09 3.571-5.173 3.571-8.825z" fill="#4285F4"/>
    <path d="M12.24 24c3.24 0 5.956-.07 7.955-1.897l-3.865-3.003c-1.074.724-2.454 1.153-4.09 1.153-3.13 0-5.785-2.112-6.733-4.952H1.52v3.096A12 12 0 0012.24 24z" fill="#34A853"/>
    <path d="M5.507 15.301A7.196 7.196 0 015.021 12c0-1.146.197-2.258.486-3.301V5.603H1.52A12.008 12.008 0 000 12c0 1.935.463 3.763 1.52 5.397l3.987-3.096z" fill="#FBBC04"/>
    <path d="M12.24 4.748c1.768 0 3.352.609 4.6 1.793l3.433-3.433C18.196 1.185 15.48 0 12.24 0A12 12 0 001.52 5.603L5.507 8.7c.948-2.84 3.603-3.952 6.733-3.952z" fill="#EA4335"/>
  </svg>
);

// ─── Feature card ──────────────────────────────────────────────────────────
const FeatureCard = ({ icon, title, desc, color }) => (
  <div className="flex gap-4 p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-card hover:shadow-card-md transition-shadow duration-200 animate-slide-up">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColors[color]}`}>
      {icon}
    </div>
    <div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ─── Main ──────────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/home");
    });

    if (isSignInWithEmailLink(auth, window.location.href)) {
      let stored = window.localStorage.getItem("emailForSignIn");
      if (!stored) {
        stored = prompt("Please provide your email for confirmation:");
        if (!stored) { setError("Email is required to complete sign-in."); return; }
      }
      signInWithEmailLink(auth, stored, window.location.href)
        .then((result) => {
          logLoginSuccess(result.user.uid, result.user.email, "email_link");
          window.localStorage.removeItem("emailForSignIn");
          navigate("/home");
        })
        .catch((err) => {
          logLoginFailure(stored, "email_link", err);
          setError("Error signing in: " + err.message);
        });
    }
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!error && !message) return;
    const t = setTimeout(() => { setError(""); setMessage(""); }, 5000);
    return () => clearTimeout(t);
  }, [error, message]);

  useEffect(() => {
    if (countdown <= 0) { setCooldown(false); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendSignInEmail = async () => {
    if (cooldown) return;
    if (!email || !validateEmail(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      logLoginAttempt(email, "email_link");
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setMessage("Check your inbox (or spam) for the sign-in link.");
      setCooldown(true); setCountdown(30);
    } catch (err) {
      logLoginFailure(email, "email_link", err);
      setError("Error sending email: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setError(""); setMessage(""); setLoading(true);
    try {
      logLoginAttempt("google_oauth_user", "google_oauth");
      const result = await signInWithPopup(auth, provider);
      logLoginSuccess(result.user.uid, result.user.email, "google_oauth");
      navigate("/home");
    } catch (popupError) {
      try {
        const result = await signInWithRedirect(auth, provider);
        if (result) {
          logLoginSuccess(result.user.uid, result.user.email, "google_oauth");
          navigate("/home");
        }
      } catch (redirectError) {
        logLoginFailure("google_oauth_user", "google_oauth", redirectError);
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav strip */}
      <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
            <img src="/favicon-32x32.png" alt="" className="h-4 w-4" />
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {envVars.REACT_APP_NAME}
          </span>
        </div>
        <div className="ml-auto">
          <Badge variant="blue">Singapore&apos;s #1 SBF Platform</Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* ── Left: value prop + features ── */}
          <div className="animate-fade-in">
            <Badge variant="blue" dot className="mb-5">Data updated hourly</Badge>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-50 leading-tight tracking-tight mb-5">
              Make smarter{" "}
              <span className="text-brand-600 dark:text-brand-400">SBF decisions</span>
              <br />with real data.
            </h1>

            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-lg">
              {envVars.REACT_APP_NAME} gives you the analytics, filters, and market intelligence to find the best Sale of Balance Flat — fast.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mb-10 pb-10 border-b border-gray-200 dark:border-gray-800">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Feature cards */}
            <div className="grid sm:grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>

          {/* ── Right: auth card ── */}
          <div className="lg:sticky lg:top-24 animate-slide-up">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card-lg p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Get started free
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Sign in or create your account in seconds.
                </p>
              </div>

              {/* Google */}
              <Button
                variant="secondary"
                size="lg"
                className="w-full mb-4"
                icon={<GoogleIcon />}
                loading={loading}
                onClick={handleGoogleSignIn}
              >
                {loading ? "Connecting…" : "Continue with Google"}
              </Button>

              <Divider label="or continue with email" className="mb-4" />

              {/* Email form */}
              <form onSubmit={(e) => { e.preventDefault(); sendSignInEmail(); }} className="space-y-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  }
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={loading}
                  disabled={cooldown}
                >
                  {cooldown
                    ? `Resend in ${countdown}s`
                    : loading
                    ? "Sending link…"
                    : "Send magic link"}
                </Button>
              </form>

              {/* Feedback messages */}
              {message && (
                <div className="mt-4 flex items-start gap-3 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
                </div>
              )}
              {error && (
                <div className="mt-4 flex items-start gap-3 p-3.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Trust signals */}
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-5 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Secured
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  No spam
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Cancel anytime
                </span>
              </div>
            </div>

            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
              By continuing you agree to our{" "}
              <a href="/terms-of-service" className="underline hover:text-gray-600 dark:hover:text-gray-300">Terms</a>
              {" and "}
              <a href="/privacy-policy" className="underline hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
