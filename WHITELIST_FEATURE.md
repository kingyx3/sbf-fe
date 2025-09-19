# Whitelist Feature for Development Environment

## Overview

This feature implements user access control for the development environment, ensuring only whitelisted users can access the dev instance while keeping production unrestricted.

## How It Works

### Environment Detection
- **Production**: No restrictions, all authenticated users can access
- **Development**: Only whitelisted users can access

### Whitelist Configuration
The whitelist is stored in Firestore:
- **Collection**: `system`
- **Document**: `users`
- **Field**: `emails` (array of email addresses)

Example Firestore document structure:
```json
{
  "emails": [
    "admin@company.com",
    "developer@company.com",
    "kingyx33@gmail.com"
  ]
}
```

### Implementation Details

1. **Authentication Flow**:
   - User signs in normally through Firebase Auth
   - `useAuth` hook checks if environment is DEV
   - If DEV, fetches whitelist from Firestore
   - If user email is not in whitelist, user is automatically signed out
   - Access denied screen is shown

2. **Components Modified**:
   - `useAuth.js` - Added whitelist checking
   - `App.js` - Shows AccessDenied component for non-whitelisted users
   - `LoginScreen.js` - Shows appropriate error messages
   - `AccessDenied.js` - New component for denied access UI

3. **Security Features**:
   - Fails securely (denies access on errors)
   - Only enforced in development environment
   - Automatic sign-out for non-whitelisted users
   - Clear error messaging

### Testing

Run the test suite:
```bash
npm test -- --watchAll=false
```

The tests cover:
- Production environment access (always allowed)
- Whitelisted user access in dev
- Non-whitelisted user access denial
- Error handling scenarios

### Setting Up the Whitelist

To configure the whitelist in Firestore:

1. Navigate to Firebase Console
2. Go to Firestore Database
3. Create/edit collection: `system`
4. Create/edit document: `users`
5. Add field: `emails` (array)
6. Add email addresses to the array

### Error Scenarios

The system handles various error scenarios gracefully:
- Firestore document doesn't exist → Deny access
- Network errors → Deny access
- Empty email array → Deny access
- Invalid Firestore data → Deny access

This ensures security by default - if anything goes wrong, access is denied rather than granted.