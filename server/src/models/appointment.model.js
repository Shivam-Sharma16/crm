// server/src/models/appointment.model.js
const mongoose = require('mongoose');

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
  // Note: Detailed clinical data (Pharmacy, Lab, Diet, Files) 
  // has moved to the 'TreatmentPlan' model.
  
  // 1. General Notes (Used during booking or for basic instructions)
  notes: {
    type: String,
    default: '' 
  },
  
  // 2. Doctor's Private Notes (Optional, separate from shared treatment plan)
  doctorNotes: {
    type: String,
    default: ''
  },

  // 3. Symptoms (Provided by patient during booking)
  symptoms: {
    type: String,
    default: ''
  },

  // 4. Legacy / Simple Diagnosis Support 
  // (Detailed diagnosis is now in TreatmentPlan, but we keep this for list views if needed)
  diagnosis: {
    type: String,
    default: ''
  },

  // 5. IVF Specific Data (Booking related details)
  ivfDetails: {
    type: mongoose.Schema.Types.Mixed, 
    default: {}
  }
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