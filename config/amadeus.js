const Amadeus = require("amadeus");
const { json } = require("body-parser");

const amadeus = new Amadeus({
  clientId: process.env["AMADEUS_CLIENT_ID"],
  clientSecret: process.env["AMADEUS_CLIENT_SECRET"],
});

module.exports = amadeus;