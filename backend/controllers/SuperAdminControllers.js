const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/coreModel/SuperAdmin'); // Import the SuperAdmin model
const admin = require('../models/coreModel/admin');

// Super Admin Register
exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if a super admin already exists with this email
    const existingSuperAdmin = await SuperAdmin.findOne({ email });
    if (existingSuperAdmin) {
      return res.status(400).json({ message: 'Super admin already exists' });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new SuperAdmin
    const newSuperAdmin = new SuperAdmin({
      email,
      password: hashedPassword,
    });

    // Save to the database
    await newSuperAdmin.save();
    res.status(201).json({ message: 'Super admin registered successfully' });
  } catch (error) {
    console.error('Error registering super admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Super Admin Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the super admin exists
    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) {
      return res.status(400).json({ message: 'Super admin not found' });
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, superAdmin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    // Generate a JWT token for the super admin
    const token = jwt.sign(
      { superAdminID: superAdmin.id, email: superAdmin.email },
      process.env.JWT_SECRET,
      { expiresIn: '4h' } // Token expires in 4 hours
    );

    // Send the token to the client
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fetch all admins
exports.getAllAdmins = async (req, res) => {
    try {
      // Fetch all admins from the database
      const admins = await admin.find(); // assuming Admin is your model for the admins collection
      if (admins.length === 0) {
        return res.status(404).json({ message: 'No admins found' });
      }
      res.status(200).json(admins); // Send back the list of admins
    } catch (error) {
      console.error('Error fetching admins:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  