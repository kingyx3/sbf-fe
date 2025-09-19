import { isEmailWhitelisted } from '../whitelistUtils';

// Mock Firebase Firestore
jest.mock('../../config/firebaseConfig', () => ({
  db: {}
}));

jest.mock('../../config/envConfig', () => ({
  envVars: {
    REACT_APP_TYPE: 'DEV'
  }
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn()
}));

describe('whitelistUtils', () => {
  const { getDoc } = require('firebase/firestore');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isEmailWhitelisted', () => {
    it('should return true for production environment', async () => {
      // Mock production environment
      const { envVars } = require('../../config/envConfig');
      envVars.REACT_APP_TYPE = 'PROD';

      const result = await isEmailWhitelisted('test@example.com');
      expect(result).toBe(true);
    });

    it('should return true for whitelisted email in dev environment', async () => {
      // Mock dev environment
      const { envVars } = require('../../config/envConfig');
      envVars.REACT_APP_TYPE = 'DEV';

      // Mock Firestore response
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          emails: ['test@example.com', 'admin@test.com']
        })
      });

      const result = await isEmailWhitelisted('test@example.com');
      expect(result).toBe(true);
    });

    it('should return false for non-whitelisted email in dev environment', async () => {
      // Mock dev environment
      const { envVars } = require('../../config/envConfig');
      envVars.REACT_APP_TYPE = 'DEV';

      // Mock Firestore response
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          emails: ['admin@test.com']
        })
      });

      const result = await isEmailWhitelisted('nonwhitelisted@example.com');
      expect(result).toBe(false);
    });

    it('should return false when Firestore document does not exist', async () => {
      // Mock dev environment
      const { envVars } = require('../../config/envConfig');
      envVars.REACT_APP_TYPE = 'DEV';

      // Mock Firestore response - document doesn't exist
      getDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await isEmailWhitelisted('test@example.com');
      expect(result).toBe(false);
    });

    it('should return false when there are no emails in the document', async () => {
      // Mock dev environment
      const { envVars } = require('../../config/envConfig');
      envVars.REACT_APP_TYPE = 'DEV';

      // Mock Firestore response - no emails array
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({})
      });

      const result = await isEmailWhitelisted('test@example.com');
      expect(result).toBe(false);
    });

    it('should return false when Firestore throws an error', async () => {
      // Mock dev environment
      const { envVars } = require('../../config/envConfig');
      envVars.REACT_APP_TYPE = 'DEV';

      // Mock Firestore error
      getDoc.mockRejectedValue(new Error('Firestore error'));

      const result = await isEmailWhitelisted('test@example.com');
      expect(result).toBe(false);
    });
  });
});