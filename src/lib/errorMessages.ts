/**
 * Maps technical error messages to user-friendly messages
 * to prevent information leakage while maintaining good UX
 */

// Common error patterns and their user-friendly messages
const errorMappings: Array<{ pattern: RegExp; message: string }> = [
  // Auth errors
  { pattern: /invalid.*credentials/i, message: 'Invalid email or password. Please try again.' },
  { pattern: /already registered/i, message: 'This email is already registered. Please sign in instead.' },
  { pattern: /email.*not.*confirmed/i, message: 'Please verify your email address before signing in.' },
  { pattern: /invalid.*email/i, message: 'Please enter a valid email address.' },
  { pattern: /password.*weak/i, message: 'Password is too weak. Please use a stronger password.' },
  { pattern: /rate.*limit/i, message: 'Too many attempts. Please wait a moment and try again.' },
  { pattern: /session.*expired/i, message: 'Your session has expired. Please sign in again.' },
  
  // Network errors
  { pattern: /network/i, message: 'Connection issue. Please check your internet and try again.' },
  { pattern: /fetch/i, message: 'Unable to load content. Please try again.' },
  { pattern: /timeout/i, message: 'Request timed out. Please try again.' },
  { pattern: /offline/i, message: 'You appear to be offline. Please check your connection.' },
  
  // Database/API errors - hide technical details
  { pattern: /violates.*policy/i, message: 'Unable to complete this action. Please try again.' },
  { pattern: /duplicate.*key/i, message: 'This item already exists.' },
  { pattern: /not.*found/i, message: 'The requested content could not be found.' },
  { pattern: /permission/i, message: 'You do not have permission to perform this action.' },
  { pattern: /unauthorized/i, message: 'Please sign in to continue.' },
];

// Default messages for unknown errors
const defaultMessages = {
  generic: 'Something went wrong. Please try again.',
  auth: 'Authentication failed. Please try again.',
  load: 'Unable to load content. Please try again.',
  save: 'Unable to save changes. Please try again.',
  network: 'Connection issue. Please try again.',
};

/**
 * Get a user-friendly error message from a technical error
 * @param error - The error object or message
 * @param context - Optional context for better default messages
 * @returns User-friendly error message
 */
export function getUserFriendlyError(
  error: unknown,
  context?: 'auth' | 'load' | 'save' | 'network'
): string {
  // Extract message from error
  let errorMessage = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  }

  // Check against known patterns
  for (const { pattern, message } of errorMappings) {
    if (pattern.test(errorMessage)) {
      return message;
    }
  }

  // Return context-specific default or generic message
  if (context && context in defaultMessages) {
    return defaultMessages[context];
  }
  
  return defaultMessages.generic;
}

/**
 * Log error details for debugging (only to console, not shown to user)
 * @param error - The original error
 * @param context - Where the error occurred
 */
export function logErrorForDebugging(error: unknown, context: string): void {
  // In development, log full error details
  if (import.meta.env.DEV) {
    console.error(`[${context}] Error:`, error);
  } else {
    // In production, log minimal info
    console.error(`[${context}] An error occurred`);
  }
}
