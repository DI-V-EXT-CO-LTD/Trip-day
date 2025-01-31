// models/inv.js
const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  total: Number,
  name: String,
  items: [],
  invoiceNumber: String,
  status: {
    type: String,
    enum: ["Pending", "Processing", "Sent", "Cancelled", "Published"],
    default: "Published",
  },
  remittanceNumber: String,
  remittanceImage: String,
  userId: String,
  createAt: {
    type: Date,
    default: Date.now,
  },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
