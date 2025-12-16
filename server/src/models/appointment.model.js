const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.Mixed,
    required: false
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
  // NEW FIELD
  prescription: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ doctorUserId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;