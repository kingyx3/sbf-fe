import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { db, realtimeDb } from "../config/firebaseConfig";
import { envVars } from "../config/envConfig";
import { setAdminClaims, listAllUsers } from "../utils/adminClaimsUtils";
import { useAdminAuth } from "../hooks/useAdminAuth";
import {
  TabNavigation,
  AnalyticsTab,
  AdminManagementTab,
  PurchaseAccessTab,
  LoginEventsTab
} from "../components/admin_dashboard";

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
  const [currentAdmins, setCurrentAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // NEW: pagination for users (25 per page)
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

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
        <TabNavigation 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            analytics={analytics}
            payments={payments}
            currentAdmins={currentAdmins}
            loginEvents={loginEvents}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'admin' && (
          <AdminManagementTab
            pagedUsers={pagedUsers}
            annotatedSortedUsers={annotatedSortedUsers}
            currentPage={currentPage}
            PAGE_SIZE={PAGE_SIZE}
            loadCurrentAdmins={loadCurrentAdmins}
            loadingAdmins={loadingAdmins}
            toggleUserAdmin={toggleUserAdmin}
            setCurrentPage={setCurrentPage}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'access' && (
          <PurchaseAccessTab
            payments={payments}
            formatTimestamp={formatTimestamp}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'logins' && (
          <LoginEventsTab
            loginEvents={loginEvents}
            formatTimestamp={formatTimestamp}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
