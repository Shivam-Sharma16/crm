const mongoose = require('mongoose');

// Define a sub-schema for Pharmacy items to ensure structure
const pharmacyItemSchema = new mongoose.Schema({
  medicineName: { 
    type: String, 
    required: [true, 'Medicine name is required'],
    trim: true
  },
  frequency: { 
    type: String, 
    default: '',
    trim: true
  }, // e.g., "2 times a day"
  duration: { 
    type: String, 
    default: '',
    trim: true
  }   // e.g., "5 days"
}, { _id: false }); // No need for individual IDs for embedded items

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  patientId: {
    type: String, // Persisted Patient ID (e.g., P-101)
    required: false,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  doctorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required']
  },
  serviceId: {
    type: String,
    required: false
  },
  serviceName: {
    type: String,
    required: false
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: '' // Used for Diagnosis/General Notes
  },
  
  // ================================================
  // NEW: EMBEDDED STRUCTURED DATA FROM DROPDOWNS
  // ================================================
  
  // 1. Lab Tests: Array of strings selected from dropdown
  labTests: [{
    type: String,
    trim: true
  }],

  // 2. Diet Plan: Array of strings selected from dropdown
  dietPlan: [{
    type: String,
    trim: true
  }],

  // 3. Pharmacy: Array of structured objects containing details
  pharmacy: [pharmacyItemSchema],
  
  // ================================================

  // Legacy single prescription file
  prescription: {
    type: String,
    default: ''
  },
  // Modern multiple prescription files support
  prescriptions: [{
    url: { type: String, required: true },
    fileId: { type: String },
    name: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Compound index for checking availability
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, appointmentTime: 1 }, 
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;