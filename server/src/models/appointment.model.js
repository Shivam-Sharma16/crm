const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String/Number for backward compatibility
    required: false // Made optional to support both old and new format
  },
  doctorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for backward compatibility
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
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
appointmentSchema.index({ userId: 1 }); // Index for user's appointments
appointmentSchema.index({ doctorUserId: 1 }); // Index for doctor's appointments
appointmentSchema.index({ doctorId: 1 }); // Index for doctor profile lookups
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 }); // Compound index for date/time sorting
appointmentSchema.index({ status: 1 }); // Index for filtering by status

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;




