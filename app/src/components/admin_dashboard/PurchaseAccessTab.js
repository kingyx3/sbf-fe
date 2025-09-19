import React from "react";
import TruncatedPaymentId from "./TruncatedPaymentId";

const PurchaseAccessTab = ({ payments, formatTimestamp, isDarkMode }) => {
  return (
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
  );
};

export default PurchaseAccessTab;