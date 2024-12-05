const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

// Define the SuperAdmin schema
const superAdminSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true, // Ensures no duplicate emails
  },
  password: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving it to the database
superAdminSchema.pre('save', async function (next) {
  const superAdmin = this;
  if (superAdmin.isModified('password')) {
    superAdmin.password = await bcrypt.hash(superAdmin.password, 10);
  }
  next();
});

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
