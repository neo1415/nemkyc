/**
 * Cost Calculator Utility
 * 
 * Calculates estimated costs for bulk identity verification operations.
 * Supports different pricing for NIN, BVN, and CAC verifications.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

/**
 * Load API costs from environment variables with defaults
 * @returns {Object} Cost configuration
 */
function loadCostConfig() {
  return {
    NIN: parseFloat(process.env.NIN_VERIFICATION_COST) || 100, // Datapro NIN verification costs ₦100
    BVN: parseFloat(process.env.BVN_VERIFICATION_COST) || 50,
    CAC: parseFloat(process.env.CAC_VERIFICATION_COST) || 100, // VerifyData CAC verification costs ₦100
    currency: process.env.COST_CURRENCY || 'NGN'
  };
}

/**
 * Format currency value according to currency code
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (e.g., 'NGN', 'USD')
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency) {
  // Handle invalid amounts
  if (typeof amount !== 'number' || isNaN(amount)) {
    amount = 0;
  }

  // Round to 2 decimal places
  const rounded = Math.round(amount * 100) / 100;

  // Format based on currency
  switch (currency) {
    case 'NGN':
      return `₦${rounded.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'USD':
      return `$${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'EUR':
      return `€${rounded.toLocaleString('en-EU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'GBP':
      return `£${rounded.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    default:
      return `${currency} ${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Calculate estimated cost for verification batch
 * @param {Object} counts - Breakdown of identity types to verify
 * @param {number} counts.nin - Number of NIN verifications (default: 0)
 * @param {number} counts.bvn - Number of BVN verifications (default: 0)
 * @param {number} counts.cac - Number of CAC verifications (default: 0)
 * @returns {Object} Cost estimate with total and breakdown
 * @property {number} totalCost - Total cost in configured currency
 * @property {string} currency - Currency code
 * @property {string} formattedTotal - Formatted total cost string
 * @property {Object} breakdown - Cost per identity type
 * @property {number} breakdown.nin - Cost for NIN verifications
 * @property {number} breakdown.bvn - Cost for BVN verifications
 * @property {number} breakdown.cac - Cost for CAC verifications
 * @property {Object} formattedBreakdown - Formatted cost strings per identity type
 */
function calculateCost(counts = {}) {
  // Load cost configuration
  const config = loadCostConfig();

  // Extract counts with defaults
  const ninCount = parseInt(counts.nin) || 0;
  const bvnCount = parseInt(counts.bvn) || 0;
  const cacCount = parseInt(counts.cac) || 0;

  // Validate counts are non-negative
  if (ninCount < 0 || bvnCount < 0 || cacCount < 0) {
    throw new Error('Identity counts must be non-negative');
  }

  // Calculate costs per identity type
  const ninCost = ninCount * config.NIN;
  const bvnCost = bvnCount * config.BVN;
  const cacCost = cacCount * config.CAC;

  // Calculate total
  const totalCost = ninCost + bvnCost + cacCost;

  return {
    totalCost,
    currency: config.currency,
    formattedTotal: formatCurrency(totalCost, config.currency),
    breakdown: {
      nin: ninCost,
      bvn: bvnCost,
      cac: cacCost
    },
    formattedBreakdown: {
      nin: formatCurrency(ninCost, config.currency),
      bvn: formatCurrency(bvnCost, config.currency),
      cac: formatCurrency(cacCost, config.currency)
    }
  };
}

module.exports = {
  calculateCost,
  formatCurrency,
  loadCostConfig
};
