const mongoose = require('mongoose');

const apisSchema = new mongoose.Schema({
  APISCODE: String,
  userId: String,
  Hotel: String,
  Amount: Number,
  useDate_Start: Date,
  useDate_End: Date,
  createAt: { type: Date, default: Date.now },
  CustomerInfo: []
});


const APIS = mongoose.model('APIS', apisSchema);

module.exports = APIS;
