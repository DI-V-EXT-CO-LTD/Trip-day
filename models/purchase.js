const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchaseId: {
    type: String,
    required: true,
    
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [],
  total:Number,
  paymentMethod:String,
  status: {
    type: String,
    enum: [ 'Confirmed', 'Processing', 'Complete', 'Cancelled', 'Failed', 'Refunded', 'Expired'],
    default: 'Processing'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
  processDescription: {
    type: String,
    default: 'Processing'
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'invoices'
  },
  purchaseLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String
  }]
}, {
  timestamps: true // This will automatically update the updatedAt field
});

module.exports = mongoose.model('Purchase', purchaseSchema);