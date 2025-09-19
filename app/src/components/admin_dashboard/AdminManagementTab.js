import React from "react";
import Pagination from "./Pagination";

const AdminManagementTab = ({ 
  pagedUsers,
  annotatedSortedUsers,
  currentPage,
  PAGE_SIZE,
  loadCurrentAdmins,
  loadingAdmins,
  toggleUserAdmin,
  setCurrentPage,
  isDarkMode 
}) => {
  const totalPages = Math.max(1, Math.ceil(annotatedSortedUsers.length / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (pageSafe - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;

  return (
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
          {annotatedSortedUsers.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIdx={startIdx}
              endIdx={endIdx}
              totalItems={annotatedSortedUsers.length}
              onPageChange={setCurrentPage}
              isDarkMode={isDarkMode}
            />
          )}
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
  );
};

export default AdminManagementTab;