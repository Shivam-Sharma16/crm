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
}, { _id: false });

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  patientId: {
    type: String,
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
  
  // --- CLINICAL DATA & NOTES ---
  
  // 1. General Notes (Legacy / Diagnosis)
  notes: {
    type: String,
    default: '' 
  },
  // 2. Prescription Description (Explicit field for Unified Form)
  prescriptionDescription: {
    type: String,
    default: ''
  },
  
  doctorNotes: {
    type: String,
    default: ''
  },
  symptoms: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    default: ''
  },

  // 3. Treatment Plans (Arrays)
  labTests: [{
    type: String,
    trim: true
  }],

  dietPlan: [{
    type: String,
    trim: true
  }],

  pharmacy: [pharmacyItemSchema], 

  // 4. IVF Specific Data (Flexible Object)
  ivfDetails: {
    type: mongoose.Schema.Types.Mixed, 
    default: {}
  },

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