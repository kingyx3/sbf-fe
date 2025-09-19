import React from "react";

const LoginEventsTab = ({ loginEvents, formatTimestamp, isDarkMode }) => {
  return (
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
  );
};

export default LoginEventsTab;