import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { db, realtimeDb } from "../config/firebaseConfig";
import { envVars } from "../config/envConfig";
import { setAdminClaims, listAllUsers } from "../utils/adminClaimsUtils";
import { useAdminAuth } from "../hooks/useAdminAuth";

const AdminDashboard = ({ isDarkMode }) => {
  const { user } = useAdminAuth();
  const [payments, setPayments] = useState([]);
  const [loginEvents, setLoginEvents] = useState([]);
  const [analytics, setAnalytics] = useState({
    dailyActiveUsers: 0,
    monthlyActiveUsers: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    loginMethodBreakdown: {},
    revenueByDay: [],
    activeUsersByDay: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [currentAdmins, setCurrentAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // NEW: pagination for users (25 per page)
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  // Helper component for truncated payment ID with copy functionality
  const TruncatedPaymentId = ({ id, maxLength = 12 }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    const truncatedId = id.length > maxLength ? `${id.substring(0, maxLength)}...` : id;
    
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{truncatedId}</span>
        <button
          onClick={handleCopy}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            copied 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
          title={copied ? 'Copied!' : 'Click to copy full ID'}
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (envVars.testMode) {
      loadTestData();
    } else {
      loadData();
      setupRealtimeListeners();
    }

    return () => {
      if (!envVars.testMode) {
        // Cleanup listeners
        const loginEventsRef = ref(realtimeDb, 'loginEvents');
        off(loginEventsRef);
      }
    };
  }, []);

  // Load current admins when admin tab is active
  useEffect(() => {
    if (activeTab === 'admin' && user) {
      loadCurrentAdmins();
    }
  }, [activeTab, user]);

  // Reset to first page when list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentAdmins]);

  const loadTestData = () => {
    // Sample test data
    const testPayments = [
      {
        id: 'test-payment-1',
        customerEmail: 'user@example.com',
        amount: 20.00,
        currency: 'sgd',
        sbfCodes: ['Jul2025'],
        timestamp: new Date()
      },
      {
        id: 'test-payment-2',
        customerEmail: 'admin@sbfhero.com',
        amount: 35.00,
        currency: 'sgd',
        sbfCodes: ['Aug2025', 'Sep2025'],
        timestamp: new Date(Date.now() - 86400000)
      }
    ];

    const testLoginEvents = [
      {
        id: 'test-login-1',
        email: 'admin@sbfhero.com',
        method: 'email_link',
        status: 'success',
        timestamp: Date.now(),
        userAgent: 'Mozilla/5.0 (Test Browser)'
      },
      {
        id: 'test-login-2',
        email: 'user@example.com',
        method: 'google_oauth',
        status: 'success',
        timestamp: Date.now() - 300000,
        userAgent: 'Mozilla/5.0 (Test Browser)'
      },
      {
        id: 'test-login-3',
        email: 'user2@example.com',
        method: 'email_link',
        status: 'success',
        timestamp: Date.now() - 86400000,
        userAgent: 'Mozilla/5.0 (Test Browser)'
      }
    ];

    setPayments(testPayments);
    setLoginEvents(testLoginEvents);
    calculateAnalytics(testLoginEvents, testPayments);

    // Test users incl. old lastSignInTime for inactive flag
    setCurrentAdmins([
      {
        uid: 'test-admin-1',
        email: 'kingyx33@gmail.com',
        displayName: 'Admin User',
        emailVerified: true,
        disabled: false,
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
        isAdmin: true,
      },
      {
        uid: 'test-admin-2', 
        email: 'admin@sbfhero.com',
        displayName: 'Test Admin',
        emailVerified: true,
        disabled: false,
        creationTime: new Date(Date.now() - 86400000).toISOString(),
        lastSignInTime: new Date(Date.now() - 3600000).toISOString(),
        isAdmin: true,
      },
      {
        uid: 'test-user-1',
        email: 'user1@example.com',
        displayName: 'Regular User',
        emailVerified: true,
        disabled: false,
        creationTime: new Date(Date.now() - 172800000).toISOString(),
        lastSignInTime: new Date(Date.now() - (200 * 24 * 60 * 60 * 1000)).toISOString(), // ~6.5 months ago
        isAdmin: false,
      },
      {
        uid: 'test-user-2',
        email: 'user2@example.com',
        displayName: null,
        emailVerified: false,
        disabled: false,
        creationTime: new Date(Date.now() - 259200000).toISOString(),
        lastSignInTime: null,
        isAdmin: false,
      }
    ]);

    setLoading(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load payments
      const paymentsSnapshot = await getDocs(query(collection(db, "payments"), orderBy("timestamp", "desc")));
      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);

    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentAdmins = async () => {
    if (envVars.testMode) {
      // handled in loadTestData
      return;
    }

    try {
      setLoadingAdmins(true);
      const result = await listAllUsers(user);
      setCurrentAdmins(result.allUsers || []);
    } catch (error) {
      console.error("Error loading users:", error);
      setCurrentAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const setupRealtimeListeners = () => {
    // Listen to login events from Realtime Database
    const loginEventsRef = ref(realtimeDb, 'loginEvents');
    onValue(loginEventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const eventsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setLoginEvents(eventsArray);
        
        // Calculate analytics when login events update
        calculateAnalytics(eventsArray, payments);
      }
    });
  };

  const calculateAnalytics = (loginEventsData, paymentsData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Calculate active users
    const todayLogins = loginEventsData.filter(event => 
      event.status === 'success' && event.timestamp >= today
    );
    const monthLogins = loginEventsData.filter(event => 
      event.status === 'success' && event.timestamp >= monthStart
    );
    
    const dailyActiveUsers = new Set(todayLogins.map(event => event.email)).size;
    const monthlyActiveUsers = new Set(monthLogins.map(event => event.email)).size;

    // Calculate revenue analytics
    const todayPayments = paymentsData.filter(payment => {
      const paymentDate = payment.timestamp?.toDate ? payment.timestamp.toDate().getTime() : payment.timestamp;
      return paymentDate >= today;
    });

    const monthPayments = paymentsData.filter(payment => {
      const paymentDate = payment.timestamp?.toDate ? payment.timestamp.toDate().getTime() : payment.timestamp;
      return paymentDate >= monthStart;
    });

    const todayRevenue = todayPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const monthRevenue = monthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalRevenue = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Login method breakdown
    const loginMethodBreakdown = loginEventsData
      .filter(event => event.status === 'success')
      .reduce((acc, event) => {
        acc[event.method] = (acc[event.method] || 0) + 1;
        return acc;
      }, {});

    // 7-day trends
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = nowMidnight - (i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const dayLogins = loginEventsData.filter(event => 
        event.status === 'success' && 
        event.timestamp >= dayStart && 
        event.timestamp < dayEnd
      );
      
      const dayPayments = paymentsData.filter(payment => {
        const paymentDate = payment.timestamp?.toDate ? payment.timestamp.toDate().getTime() : payment.timestamp;
        return paymentDate >= dayStart && paymentDate < dayEnd;
      });

      last7Days.push({
        date: new Date(dayStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activeUsers: new Set(dayLogins.map(event => event.email)).size,
        revenue: dayPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
      });
    }

    setAnalytics({
      dailyActiveUsers,
      monthlyActiveUsers,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      loginMethodBreakdown,
      revenueByDay: last7Days,
      activeUsersByDay: last7Days
    });
  };

  // Update analytics when payments or logins change (non-test)
  useEffect(() => {
    if (!envVars.testMode) {
      calculateAnalytics(loginEvents, payments);
    }
  }, [payments, loginEvents]);

  const createAdminUser = async () => {
    if (!newAdminEmail.trim()) return;

    if (envVars.testMode) {
      setNewAdminEmail('');
      alert('Admin user created successfully! (Test Mode)');
      return;
    }

    try {
      const idToken = await user.getIdToken();
      await setAdminClaims(null, newAdminEmail, true, idToken);

      setNewAdminEmail('');
      alert('Admin user created successfully!');
      loadCurrentAdmins();
    } catch (error) {
      console.error("Error creating admin user:", error);
      alert('Error creating admin user: ' + error.message);
    }
  };

  const toggleUserAdmin = async (userEmail, currentAdminStatus) => {
    if (envVars.testMode) {
      alert(`Admin status ${!currentAdminStatus ? 'granted' : 'revoked'} for ${userEmail} (Test Mode)`);
      return;
    }

    try {
      const idToken = await user.getIdToken();
      await setAdminClaims(null, userEmail, !currentAdminStatus, idToken);
      
      alert(`Admin status ${!currentAdminStatus ? 'granted' : 'revoked'} for ${userEmail}`);
      loadCurrentAdmins();
    } catch (error) {
      console.error("Error updating user admin status:", error);
      alert('Error updating admin status: ' + error.message);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleString();
    }
    
    return timestamp.toString();
  };

  // ---- NEW: Sorted + annotated users with inactivity flag + pagination ----
  const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000; // ~6 months
  const nowMs = Date.now();
  const sixMonthsAgoMs = nowMs - sixMonthsMs;

  const annotatedSortedUsers = useMemo(() => {
    const mapped = (currentAdmins || []).map(u => {
      const lastMs = u.lastSignInTime ? new Date(u.lastSignInTime).getTime() : null;
      const isInactive = !lastMs || lastMs < sixMonthsAgoMs; // never signed in or older than 6 months
      return {
        ...u,
        _lastSignInMs: lastMs ?? 0,
        _isInactive: isInactive
      };
    });

    // Sort: admins first, then last sign in desc
    mapped.sort((a, b) => {
      const adminDelta = (b.isAdmin === true) - (a.isAdmin === true);
      if (adminDelta !== 0) return adminDelta;
      return (b._lastSignInMs || 0) - (a._lastSignInMs || 0);
    });

    return mapped;
  }, [currentAdmins, sixMonthsAgoMs]);

  const totalPages = Math.max(1, Math.ceil(annotatedSortedUsers.length / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (pageSafe - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const pagedUsers = annotatedSortedUsers.slice(startIdx, endIdx);

  const Pagination = () => (
    <div className="flex items-center justify-between mt-4">
      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Showing <span className="font-medium">{annotatedSortedUsers.length === 0 ? 0 : startIdx + 1}</span>–
        <span className="font-medium">{Math.min(endIdx, annotatedSortedUsers.length)}</span> of{" "}
        <span className="font-medium">{annotatedSortedUsers.length}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={pageSafe <= 1}
          className={`px-3 py-1 rounded text-sm ${
            pageSafe <= 1
              ? 'opacity-50 cursor-not-allowed'
              : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => setCurrentPage(n)}
            className={`px-3 py-1 rounded text-sm ${
              n === pageSafe
                ? 'bg-blue-600 text-white'
                : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={pageSafe >= totalPages}
          className={`px-3 py-1 rounded text-sm ${
            pageSafe >= totalPages
              ? 'opacity-50 cursor-not-allowed'
              : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'admin', label: 'Admin Management', icon: '👑' },
    { id: 'access', label: 'Purchase Access', icon: '🔑' },
    { id: 'logins', label: 'Login Events', icon: '🔐' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">🏢 Business Admin Dashboard</h1>
          <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage users, monitor payments, and view system analytics
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-300 dark:border-gray-600">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="block sm:hidden">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
                  <span className="block sm:hidden text-2xs mt-1">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">👥</div>
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Daily Active Users
                    </h3>
                    <p className="text-2xl font-semibold">{analytics.dailyActiveUsers}</p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📅</div>
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Monthly Active Users
                    </h3>
                    <p className="text-2xl font-semibold">{analytics.monthlyActiveUsers}</p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">💰</div>
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Today's Revenue
                    </h3>
                    <p className="text-2xl font-semibold">SGD ${analytics.todayRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">💎</div>
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Total Revenue
                    </h3>
                    <p className="text-2xl font-semibold">SGD ${analytics.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 7-Day Active Users Trend */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h3 className="text-lg font-semibold mb-4">7-Day Active Users Trend</h3>
                <div className="space-y-2">
                  {analytics.activeUsersByDay.map((day, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {day.date}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="bg-blue-500 h-2 rounded"
                          style={{ width: `${Math.max(day.activeUsers * 10, 4)}px` }}
                        ></div>
                        <span className="text-sm font-medium w-8 text-right">{day.activeUsers}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Revenue Trend */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h3 className="text-lg font-semibold mb-4">7-Day Revenue Trend</h3>
                <div className="space-y-2">
                  {analytics.revenueByDay.map((day, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {day.date}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="bg-green-500 h-2 rounded"
                          style={{ width: `${Math.max(day.revenue * 2, 4)}px` }}
                        ></div>
                        <span className="text-sm font-medium w-16 text-right">${day.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Login Method Breakdown */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h3 className="text-lg font-semibold mb-4">Login Method Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.loginMethodBreakdown).map(([method, count]) => (
                    <div key={method} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          method === 'google_oauth' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : method === 'email_link'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {method.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Revenue Summary */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                <h3 className="text-lg font-semibold mb-4">Monthly Revenue Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>This Month</span>
                    <span className="font-semibold text-green-600">SGD ${analytics.monthRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Payments</span>
                    <span className="font-medium">{payments.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg. Payment</span>
                    <span className="font-medium">
                      SGD ${payments.length > 0 ? (analytics.totalRevenue / payments.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 sm:p-6`}>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Admin Management</h2>
            
            <div className="space-y-6">
              {/* All Users */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <h3 className="text-base sm:text-lg font-medium">All Users</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadCurrentAdmins}
                      disabled={loadingAdmins}
                      className={`px-3 py-2 text-sm rounded-md ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${loadingAdmins ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {loadingAdmins ? 'Loading…' : '🔄 Refresh'}
                    </button>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Display Name</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Role</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Last Sign In</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedUsers.map((u) => (
                        <tr key={u.uid} className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              <span className="font-medium">{u.email}</span>
                              {u.emailVerified && (
                                <span className="ml-2 text-green-500 text-xs">✓</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {u.displayName || <span className="text-gray-500 italic">No display name</span>}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              u.isAdmin 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                            }`}>
                              {u.isAdmin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td className="px-4 py-2 space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              u.disabled 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {u.disabled ? 'Disabled' : 'Enabled'}
                            </span>
                            {u._isInactive && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Inactive (6+ mo)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {u.lastSignInTime 
                              ? new Date(u.lastSignInTime).toLocaleDateString()
                              : <span className="text-gray-500 italic">Never</span>
                            }
                          </td>
                          <td className="px-4 py-2">
                            {u.isAdmin ? (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Revoke admin access from ${u.email}?`)) {
                                    toggleUserAdmin(u.email, true);
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Revoke
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Grant admin access to ${u.email}?`)) {
                                    toggleUserAdmin(u.email, false);
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Grant Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {pagedUsers.map((u) => (
                    <div key={u.uid} className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="font-medium truncate">{u.email}</p>
                            {u.emailVerified && (
                              <span className="ml-2 text-green-500 text-xs">✓</span>
                            )}
                          </div>
                          {u.displayName && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{u.displayName}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            u.isAdmin 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                          }`}>
                            {u.isAdmin ? 'Admin' : 'User'}
                          </span>
                          <div className="flex flex-wrap gap-2 justify-end">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              u.disabled 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {u.disabled ? 'Disabled' : 'Enabled'}
                            </span>
                            {u._isInactive && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Inactive (6+ mo)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Last Sign In: </span>
                          <span>
                            {u.lastSignInTime 
                              ? new Date(u.lastSignInTime).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </div>
                        <div className="pt-2">
                          {u.isAdmin ? (
                            <button
                              onClick={() => {
                                if (window.confirm(`Revoke admin access from ${u.email}?`)) {
                                  toggleUserAdmin(u.email, true);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Revoke Admin Access
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (window.confirm(`Grant admin access to ${u.email}?`)) {
                                  toggleUserAdmin(u.email, false);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Grant Admin Access
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {annotatedSortedUsers.length === 0 && !loadingAdmins && (
                  <div className="text-center py-8 text-gray-500">
                    No users found
                  </div>
                )}

                {/* Pagination Controls */}
                {annotatedSortedUsers.length > 0 && <Pagination />}
              </div>

              {/* Instructions */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="font-medium mb-2">Notes</h4>
                <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>• Users must have existing accounts before granting admin access</li>
                  <li>• Admin status is managed through Firebase Auth custom claims</li>
                  <li>• Changes take effect after user refreshes their session</li>
                  <li>• <span className="font-medium">Inactive (6+ mo)</span> indicates no sign-in within ~6 months (or never signed in)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 sm:p-6`}>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Purchase Access Records</h2>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Access records derived from payment transactions
            </p>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <th className="px-4 py-2 text-left text-sm font-medium">Customer Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">SBF Codes Purchased</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Payment Amount</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Payment ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Purchase Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <td className="px-4 py-2">{payment.customerEmail}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(payment.sbfCodes) 
                            ? payment.sbfCodes.map((code, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs"
                                >
                                  {code}
                                </span>
                              ))
                            : <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs">
                                {payment.sbfCodes}
                              </span>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-2 font-medium text-green-600">
                        {payment.currency?.toUpperCase()} ${payment.amount}
                      </td>
                      <td className="px-4 py-2">
                        <TruncatedPaymentId id={payment.id} />
                      </td>
                      <td className="px-4 py-2 text-sm">{formatTimestamp(payment.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{payment.customerEmail}</p>
                      <p className="text-lg font-bold text-green-600">{payment.currency?.toUpperCase()} ${payment.amount}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>SBF Codes:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(payment.sbfCodes) 
                          ? payment.sbfCodes.map((code, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs"
                              >
                                {code}
                              </span>
                            ))
                          : <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs">
                              {payment.sbfCodes}
                            </span>
                        }
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date: </span>
                        <span>{formatTimestamp(payment.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>ID: </span>
                        <TruncatedPaymentId id={payment.id} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {payments.length === 0 && (
              <div className="text-center py-8 text-gray-500">No purchase access records found</div>
            )}
          </div>
        )}

        {activeTab === 'logins' && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 sm:p-6`}>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Login Events & Insights</h2>
            
            {/* Login Insights Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <h4 className="font-medium mb-2 text-sm sm:text-base">Total Login Events</h4>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{loginEvents.length}</p>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <h4 className="font-medium mb-2 text-sm sm:text-base">Successful Logins</h4>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {loginEvents.filter(e => e.status === 'success').length}
                </p>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <h4 className="font-medium mb-2 text-sm sm:text-base">Failed Logins</h4>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {loginEvents.filter(e => e.status === 'failure').length}
                </p>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Method</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">IP Address</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Timestamp</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {loginEvents.slice(0, 50).map((event) => (
                    <tr key={event.id} className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <td className="px-4 py-2">{event.email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          event.method === 'google_oauth' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : event.method === 'email_link'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {event.method}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          event.status === 'success' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : event.status === 'failure'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm font-mono">
                        {event.ipAddress || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm">{formatTimestamp(event.timestamp)}</td>
                      <td className="px-4 py-2 text-xs truncate max-w-xs" title={event.userAgent}>
                        {event.userAgent ? event.userAgent.substring(0, 50) + '...' : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3">
              {loginEvents.slice(0, 50).map((event) => (
                <div key={event.id} className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.email}</p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                        event.method === 'google_oauth' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : event.method === 'email_link'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {event.method}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                        event.status === 'success' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : event.status === 'failure'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Time: </span>
                      <span>{formatTimestamp(event.timestamp)}</span>
                    </div>
                    {event.ipAddress && (
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>IP: </span>
                        <span className="font-mono text-xs">{event.ipAddress}</span>
                      </div>
                    )}
                    {event.userAgent && (
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Browser: </span>
                        <span className="text-xs">{event.userAgent.substring(0, 80)}{event.userAgent.length > 80 ? '...' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {loginEvents.length === 0 && (
              <div className="text-center py-8 text-gray-500">No login events found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
