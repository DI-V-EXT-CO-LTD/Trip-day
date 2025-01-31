const Paymentwall = require('paymentwall');

Paymentwall.Configure(
  process.env.PAYMENTWALL_PROJECT_KEY,
  process.env.PAYMENTWALL_SECRET_KEY,
);

module.exports = Paymentwall;
