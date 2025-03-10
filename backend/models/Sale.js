const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  orderNo: { type: String, required: true, unique: true },
  clientName: String,
  location: String,
  entryPerson: String,
  basicOrderValue: Number,
  GST: Number,
  totalOrderValue: Number,
  vendorsName: String,
  orderValue: Number,
  payment: String,
  deliveryDate: Date,
  status: String,
  remarks: String,
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);



