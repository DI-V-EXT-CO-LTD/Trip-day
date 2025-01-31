const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  APISCODE: String,
  userId: String,
  Hotel: String,
  Amount: Number,
  useDate: Date,
  createAt: { type: Date, default: Date.now },
  CustomerInfo: []
});


const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
