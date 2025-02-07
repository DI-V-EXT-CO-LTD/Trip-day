// models/voucher.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const voucherSchema = new Schema({
  voucherCode: { type: String, required: true, unique: true },
  purchaseId:{type:mongoose.Schema.ObjectId,require:true},
  title: { type: String, required: true },
  detail: { type: String, required: false },
  initialQuantity: { type: Number, required: true },
  remainingQuantity: { type: Number, required: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  customerFN: { type: String, required: false },
  customerLN: { type: String, required: false },
  hotelId: { type: mongoose.Schema.ObjectId, required: false },
  golfId: { type: mongoose.Schema.ObjectId, required: false },
  packageId: { type: mongoose.Schema.ObjectId, required: false },
  userId: { type: mongoose.Schema.ObjectId, required: true },
  createAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Voucher', voucherSchema);
