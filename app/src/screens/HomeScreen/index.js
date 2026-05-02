import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../../config/firebaseConfig";
import { envVars } from "../../config/envConfig";

import useListSbfCodes from "../../hooks/useListSBFCodes";
import LoadingSpinner from "../../components/LoadingSpinner";
import Dashboard from "../../components/dashboard";
import PurchaseDashboardBlock from "./purchase/PurchaseDashboardBlock";
import SimpleDashboardUpsell from "./purchase/SimpleDashboardUpsell";
import { sortSBFCodesChronologically } from "../../components/helpers";

const HomeScreen = ({ isDarkMode, footerHeight, isFooterVisible }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [availableDashboards, setAvailableDashboards] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState([]);
  const [boughtAccess, setBoughtAccess] = useState(false);
  const [hasUnlimitedAccess, setHasUnlimitedAccess] = useState(false);
  const [userId, setUserId] = useState(null);
  const [paymentDocCount, setPaymentDocCount] = useState(null);
  const [latestSbfCode, setLatestSbfCode] = useState(null);
  const [accessibleSbfCodes, setAccessibleSbfCodes] = useState([]);
  // Store paid codes in state so the derived-codes effect can react to them
  const [paidSbfCodes, setPaidSbfCodes] = useState(null);

  const { dashboards: allDashboards, isLoading: isLoadingSbfCodes } = useListSbfCodes();

  // Effect 1: Auth + Firestore access snapshot — no allDashboards dependency,
  // so it never re-subscribes when the SBF code list updates.
  useEffect(() => {
    if (envVars.testMode) {
      setPaidSbfCodes(new Set(["Unlimited"]));
      setPaymentDocCount(1);
      setBoughtAccess(true);
      setHasUnlimitedAccess(true);
      setLoading(false);
      return;
    }

    // Hold the snapshot unsubscriber so the effect cleanup can reach it
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      // Clean up any previous snapshot listener (e.g. if auth user changes)
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUserId(currentUser.uid);

      const q = query(collection(db, "access"), where("userId", "==", currentUser.uid));
      let isFirstLoad = true;

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const codes = new Set();
          snapshot.forEach((doc) => codes.add(doc.data().sbfCode.trim()));

          const hasUnlimited = codes.has("Unlimited");

          setPaymentDocCount(snapshot.size);
          setPaidSbfCodes(codes);
          setBoughtAccess(hasUnlimited || codes.size > 0);
          setHasUnlimitedAccess(hasUnlimited);

          if (isFirstLoad) {
            setLoading(false);
            isFirstLoad = false;
          }
        },
        (error) => {
          console.error("Access snapshot error:", error);
          if (isFirstLoad) {
            setLoading(false);
            isFirstLoad = false;
          }
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: Derive accessible / available SBF codes whenever the source data changes.
  // Runs when allDashboards loads OR when paidSbfCodes updates — no subscription side-effects.
  useEffect(() => {
    if (!allDashboards?.length || paidSbfCodes === null) return;

    if (envVars.testMode) {
      const all = allDashboards.filter((d) => !d.preOrder).map((d) => d.name);
      const sorted = sortSBFCodesChronologically(all);
      setLatestSbfCode(sorted[0] ?? null);
      setAccessibleSbfCodes(sorted);
      setAvailableDashboards(["Jul2025"]);
      return;
    }

    const nonPreOrders = allDashboards.filter((d) => !d.preOrder).map((d) => d.name);

    if (paidSbfCodes.has("Unlimited") || paidSbfCodes.size > 0) {
      const accessible = paidSbfCodes.has("Unlimited")
        ? nonPreOrders
        : nonPreOrders.filter((name) => paidSbfCodes.has(name));

      const sorted = sortSBFCodesChronologically(accessible);
      setLatestSbfCode(sorted[0] ?? null);
      setAccessibleSbfCodes(sorted);
    }

    setAvailableDashboards(allDashboards.filter(({ name }) => !paidSbfCodes.has(name)));
  }, [allDashboards, paidSbfCodes]);

  const handleCheckout = async () => {
    setPaymentLoading(true);
    try {
      const email = auth.currentUser?.email || "test@gmail.com";
      const productCodes = selectedPurchase.map((d) => d.name);
      const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");
      const result = await createCheckoutSession({ email, productCodes });
      window.location.href = result.data.url;
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment failed. Please try again.");
      setPaymentLoading(false);
    }
  };

  // Don't render Dashboard until all identifiers are ready — including latestSbfCode,
  // which is derived in Effect 2. Without this guard, Dashboard mounts with
  // selectedSbfCode = null, the query is disabled, and React Query v5 returns
  // isLoading = false, causing a blank screen.
  const isDataReady = envVars.testMode
    ? paymentDocCount !== null && latestSbfCode !== null
    : userId !== null && paymentDocCount !== null && latestSbfCode !== null;

  if (loading || isLoadingSbfCodes || (boughtAccess && !isDataReady)) {
    return <LoadingSpinner />;
  }

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {boughtAccess ? (
        <main className="lg:ml-80 px-2 max-w-full">
          <Dashboard
            isDarkMode={isDarkMode}
            userId={userId}
            paymentDocCount={paymentDocCount}
            latestSbfCode={latestSbfCode}
            accessibleSbfCodes={accessibleSbfCodes}
            footerHeight={footerHeight}
            isFooterVisible={isFooterVisible}
          />
          {availableDashboards.length > 0 && !hasUnlimitedAccess && (
            <SimpleDashboardUpsell
              availableDashboards={availableDashboards}
              selectedPurchase={selectedPurchase}
              setSelectedPurchase={setSelectedPurchase}
              handleCheckout={handleCheckout}
              paymentLoading={paymentLoading}
            />
          )}
        </main>
      ) : (
        <PurchaseDashboardBlock
          availableDashboards={availableDashboards}
          selectedPurchase={selectedPurchase}
          setSelectedPurchase={setSelectedPurchase}
          handleCheckout={handleCheckout}
          paymentLoading={paymentLoading}
        />
      )}
    </div>
  );
};

export default HomeScreen;
