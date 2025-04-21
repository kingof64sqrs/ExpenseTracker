const mongoose = require('mongoose');
//updated
const expenseSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Change ObjectId to String
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  isRecurring: { type: Boolean, default: false },
  isAnomaly: { type: Boolean, default: false },
  anomalyReason: { type: String, default: null },
  anomalyConfidence: { type: Number, default: 0 },
  // Additional fields for advanced anomaly detection
  anomalyType: { 
    type: String, 
    enum: ['amount', 'timing', 'frequency', 'budget_threshold', 'budget_depletion', 'rapid_succession', 'combined', null], 
    default: null 
  },
  lastAnalyzed: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
