/**
 * Money is stored as an integer number of paise (1 rupee = 100 paise) so balances never
 * suffer from floating-point rounding. The API accepts and returns rupees.
 */

const MAX_TRANSFER_RUPEES = 100000;

function rupeesToPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

function paiseToRupees(paise) {
  return paise / 100;
}

/** True when the value has at most two decimal places. */
function hasAtMostTwoDecimals(value) {
  return Math.abs(Math.round(value * 100) - value * 100) < 1e-6;
}

function randomPaiseBetween(minRupees, maxRupees, random = Math.random) {
  const min = rupeesToPaise(minRupees);
  const max = rupeesToPaise(maxRupees);
  return min + Math.floor(random() * (max - min + 1));
}

module.exports = {
  MAX_TRANSFER_RUPEES,
  rupeesToPaise,
  paiseToRupees,
  hasAtMostTwoDecimals,
  randomPaiseBetween,
};
