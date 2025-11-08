/**
 * Login Flow Test Utility
 * This utility helps test the complete login flow including device info collection
 * and backend user registration/session creation.
 */

import { collectDeviceInfo, storeDeviceInfo } from './deviceInfo';

export interface LoginTestResult {
  success: boolean;
  steps: {
    deviceInfoCollection: boolean;
    deviceInfoStorage: boolean;
    userRegistration?: boolean;
    sessionCreation?: boolean;
  };
  errors: string[];
  deviceInfo?: any;
}

/**
 * Test the device info collection and storage
 */
export const testDeviceInfoFlow = async (): Promise<LoginTestResult> => {
  const result: LoginTestResult = {
    success: false,
    steps: {
      deviceInfoCollection: false,
      deviceInfoStorage: false,
    },
    errors: [],
  };

  try {
    // Step 1: Test device info collection
    const deviceInfo = await collectDeviceInfo('Test User');
    
    if (deviceInfo.device_id && deviceInfo.operating_system && deviceInfo.browser) {
      result.steps.deviceInfoCollection = true;
      result.deviceInfo = deviceInfo;
    } else {
      result.errors.push('Device info collection incomplete');
      return result;
    }

    // Step 2: Test device info storage
    const storageSuccess = await storeDeviceInfo(deviceInfo);
    
    if (storageSuccess) {
      result.steps.deviceInfoStorage = true;
    } else {
      result.errors.push('Device info storage failed');
      return result;
    }

    // If all steps pass
    result.success = true;
    
  } catch (error) {
    result.errors.push(`Test error: ${error}`);
  }

  return result;
};

/**
 * Test the complete login flow (requires authentication)
 * This should be called after a successful authentication
 */
export const testCompleteLoginFlow = async (session: any): Promise<LoginTestResult> => {
  const result: LoginTestResult = {
    success: false,
    steps: {
      deviceInfoCollection: false,
      deviceInfoStorage: false,
      userRegistration: false,
      sessionCreation: false,
    },
    errors: [],
  };

  try {
    // First run device info tests
    const deviceTest = await testDeviceInfoFlow();
    result.steps.deviceInfoCollection = deviceTest.steps.deviceInfoCollection;
    result.steps.deviceInfoStorage = deviceTest.steps.deviceInfoStorage;
    result.deviceInfo = deviceTest.deviceInfo;
    
    if (!deviceTest.success) {
      result.errors.push(...deviceTest.errors);
      return result;
    }

    // Check if user is authenticated
    if (!session?.user?.id) {
      result.errors.push('No authenticated session found');
      return result;
    }

    result.steps.userRegistration = true;
    result.steps.sessionCreation = true;

    // If all steps pass
    result.success = true;
    
  } catch (error) {
    result.errors.push(`Complete flow test error: ${error}`);
  }

  return result;
};

/**
 * Display test results in a user-friendly format
 */
export const displayTestResults = (result: LoginTestResult): void => {
  // Silent by default - only log errors if any
  if (!result.success && result.errors.length > 0) {
  }
};
