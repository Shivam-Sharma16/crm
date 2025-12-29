// server/src/models/treatmentPlan.model.js
const mongoose = require('mongoose');

// Sub-schema for Pharmacy items
const pharmacyItemSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  frequency: { type: String, default: '' },
  duration: { type: String, default: '' }
}, { _id: false });

const treatmentPlanSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true // One plan per appointment
  },
  doctorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: String, // Persistent ID like P-1001
    required: false
  },

  // --- Clinical Notes ---
  diagnosis: { type: String, default: '' }, // Short diagnosis
  prescriptionDescription: { type: String, default: '' }, // Detailed notes

  // --- Arrays ---
  labTests: { type: [String], default: [] },
  dietPlan: { type: [String], default: [] },
  pharmacy: { type: [pharmacyItemSchema], default: [] },

  // --- Files ---
  attachments: [{
    url: { type: String, required: true },
    fileId: { type: String },
    name: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('TreatmentPlan', treatmentPlanSchema);