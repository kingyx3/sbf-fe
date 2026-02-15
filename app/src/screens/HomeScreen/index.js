import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../../config/firebaseConfig";
import { envVars } from "../../config/envConfig";

// Hooks
import useListSbfCodes from "../../hooks/useListSBFCodes";

// Components
import LoadingSpinner from "../../components/LoadingSpinner";
import Dashboard from "../../components/dashboard";
import PurchaseDashboardBlock from "./purchase/PurchaseDashboardBlock";
import SimpleDashboardUpsell from "./purchase/SimpleDashboardUpsell";
import { sortSBFCodesChronologically } from "../../components/helpers"

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

  const { dashboards: allDashboards, isLoading: isLoadingSbfCodes } = useListSbfCodes("");

  useEffect(() => {
    if (envVars.testMode) {
      console.log(loading, isLoadingSbfCodes)
      setAvailableDashboards(["Jul2025"]);
      setLoading(false);
      setBoughtAccess(true);
      setPaymentDocCount(1)
      setHasUnlimitedAccess(true)
      return;
    } else {
      const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        if (!currentUser) {
          // navigate("/login");
          return;
        }

        setUserId(currentUser.uid);

        const paymentsRef = collection(db, "access");
        const q = query(paymentsRef, where("userId", "==", currentUser.uid));
        let isFirstLoad = true;

        const unsub = onSnapshot(
          q,
          (querySnapshot) => {
            const currentCount = querySnapshot.size;
            setPaymentDocCount(currentCount);

            const paidSbfCodes = new Set();
            querySnapshot.forEach((doc) => {
              const paymentData = doc.data();
              paidSbfCodes.add(paymentData.sbfCode.trim());
            });

            const hasUnlimited = paidSbfCodes.has("Unlimited");
            setHasUnlimitedAccess(hasUnlimited);

            if (hasUnlimited || paidSbfCodes.size > 0) {
              // Paying user
              setBoughtAccess(true);

              let accessibleSbfCodes
              if (hasUnlimited) {
                // Unlimited user
                // console.log("Unlimited user")
                accessibleSbfCodes = allDashboards.filter(item => item.preOrder === false).map(item => item.name);
              } else {
                // A la carte user - filter out pre-orders
                // console.log("Limited user")
                accessibleSbfCodes = allDashboards
                  .filter(item => paidSbfCodes.has(item.name) && item.preOrder === false)
                  .map(item => item.name);
              }
              // console.log('accessibleSbfCodes', accessibleSbfCodes)
              const sortedPaidSbfCodes = sortSBFCodesChronologically(accessibleSbfCodes);
              // console.log('sortedPaidSbfCodes', sortedPaidSbfCodes)
              const lastSbfCode = sortedPaidSbfCodes.at(0)
              // console.log('lastSbfCode', lastSbfCode)
              setLatestSbfCode(lastSbfCode)
            }

            if (allDashboards?.length) {
              const unpaid = allDashboards.filter(({ name }) => !paidSbfCodes.has(name));
              setAvailableDashboards(unpaid);
            }

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

        return () => unsub();
      });

      return () => unsubscribe();
    }
  }, [navigate, allDashboards]);

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

  // Wait for all necessary data before rendering Dashboard
  // This ensures useFetchCSV has userId and paymentDocCount to enable the query
  // In non-test mode, both userId and paymentDocCount must be set before rendering
  const isDataReady = envVars.testMode 
    ? paymentDocCount !== null  // In test mode, only need paymentDocCount
    : userId && paymentDocCount !== null;  // In normal mode, need both
  
  if (loading || isLoadingSbfCodes || (boughtAccess && !isDataReady)) {
    return <LoadingSpinner />;
  }

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
      {boughtAccess ? (
        <main className="lg:ml-80 px-2 max-w-full">
          <Dashboard
            isDarkMode={isDarkMode}
            userId={userId}
            paymentDocCount={paymentDocCount}
            latestSbfCode={latestSbfCode}
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
