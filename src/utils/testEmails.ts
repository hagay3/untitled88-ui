/**
 * Utility functions for checking test email access
 */

/**
 * Check if a user's email is in the allowed test emails list
 * @param userEmail - The user's email address
 * @returns boolean - True if the email is in the test list
 */
export const isTestEmail = (userEmail: string | null | undefined): boolean => {
  if (!userEmail) {
    return false;
  }

  // Get the test emails from environment variable
  const testEmails = process.env.NEXT_PUBLIC_TEST_EMAILS;
  
  if (!testEmails) {
    return false;
  }

  // Split by comma and trim whitespace, then check if user email is included
  const allowedEmails = testEmails
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);

  return allowedEmails.includes(userEmail.toLowerCase());
};

/**
 * Check if JSON copy functionality should be enabled for the current user
 * @param userEmail - The user's email address
 * @returns boolean - True if JSON copy should be enabled
 */
export const canCopyJson = (userEmail: string | null | undefined): boolean => {
  return isTestEmail(userEmail);
};
