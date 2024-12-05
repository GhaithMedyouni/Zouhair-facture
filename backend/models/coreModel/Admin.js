const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const adminSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  // enabled: {
  //   type: Boolean,
  //   default: false,
  // },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  password: {
    type: String,
    require: false,
},
  name: { type: String, required: true },
  surname: { type: String },
  photo: {
    type: String,
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    default: 'owner',
    enum: ['owner'],
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  lastOtpRequest: {
    type: Date,
  },
  currentSessionId: {
    type: String, // Store the session ID or token reference
  },
  etat: {
    type: String,
    enum: ['active', 'suspended', 'notActive'], // Possible states
    default: 'notActive', // Default is active
  },
  planExpiration: { type: Date, required: true }, // Field for plan expiration
});
adminSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10); // Await the hash function
  }
  next();
});




module.exports = mongoose.model('Admin', adminSchema);