const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.Mixed, // Storing as Mixed to handle both String (legacy) and ObjectId
    required: true
  },
  doctorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
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
    default: 'pending'
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
    default: ''
  },
  prescription: {
    type: String,
    default: ''
  },
  // Array for multiple prescriptions
  prescriptions: [{
    url: { type: String, required: true },
    fileId: { type: String },
    name: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// --- EXISTING INDEXES ---
appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ doctorUserId: 1 });
appointmentSchema.index({ status: 1 });

// --- NEW: PROPER BOOKING AUTHENTICATION INDEX ---
// This Unique Compound Index prevents duplicate bookings at the DB level.
// It says: "A doctor cannot have two appointments at the same date and time, UNLESS the status is 'cancelled'."
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, appointmentTime: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: { $ne: 'cancelled' } } 
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;