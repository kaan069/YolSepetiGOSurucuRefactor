/**
 * Turkish ID Number (TC Kimlik No) Validation
 *
 * Turkish ID numbers are 11-digit numbers with a specific checksum algorithm:
 * - First digit cannot be 0
 * - 10th digit = (sum of first 9 digits) % 10
 * - 11th digit = (sum of first 10 digits) % 10
 * - Alternative 10th digit check: ((sum of 1st,3rd,5th,7th,9th digits * 7) - (sum of 2nd,4th,6th,8th digits)) % 10
 */

export interface TCValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a Turkish ID number (TC Kimlik No)
 * @param tcNumber - The TC number to validate (as string)
 * @returns TCValidationResult with isValid flag and optional error message
 */
export function validateTCNumber(tcNumber: string): TCValidationResult {
  // Remove any whitespace
  const tc = tcNumber.trim();

  // Check if it's 11 digits
  if (!/^\d{11}$/.test(tc)) {
    return {
      isValid: false,
      error: 'TC Kimlik No 11 haneli olmalıdır'
    };
  }

  // First digit cannot be 0
  if (tc[0] === '0') {
    return {
      isValid: false,
      error: 'TC Kimlik No 0 ile başlayamaz'
    };
  }

  // Convert to array of numbers
  const digits = tc.split('').map(Number);

  // Validate 10th digit
  // Algorithm: ((sum of odd positions 1,3,5,7,9) * 7 - (sum of even positions 2,4,6,8)) % 10
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = ((oddSum * 7) - evenSum) % 10;

  if (digits[9] !== digit10) {
    return {
      isValid: false,
      error: 'Geçersiz TC Kimlik No (10. hane hatalı)'
    };
  }

  // Validate 11th digit
  // Algorithm: (sum of first 10 digits) % 10
  const sumFirst10 = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0);
  const digit11 = sumFirst10 % 10;

  if (digits[10] !== digit11) {
    return {
      isValid: false,
      error: 'Geçersiz TC Kimlik No (11. hane hatalı)'
    };
  }

  return {
    isValid: true
  };
}

/**
 * Simple wrapper that returns only boolean
 * @param tcNumber - The TC number to validate
 * @returns true if valid, false otherwise
 */
export function isValidTCNumber(tcNumber: string): boolean {
  return validateTCNumber(tcNumber).isValid;
}
