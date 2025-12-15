const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// JWT Secret (should be in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create new user with role 'user'
    const user = new User({
      name,
      email,
      password,
      phone: phone || '',
      role: 'user' // Explicitly set role to 'user'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate key error for username index (old schema migration issue)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
      try {
        // Attempt to drop the old username index
        await User.collection.dropIndex('username_1');
        console.log('✓ Dropped old username_1 index, retrying signup...');
        
        // Retry creating the user
        const user = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          phone: req.body.phone || '',
          role: 'user'
        });
        
        await user.save();
        
        const token = jwt.sign(
          { userId: user._id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(201).json({
          success: true,
          message: 'User created successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        });
      } catch (retryError) {
        console.error('Retry error:', retryError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error creating user. Please try again.', 
          error: retryError.message 
        });
      }
    }
    
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error creating user', 
      error: error.message 
    });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Convert email to lowercase to match database (User model has lowercase: true)
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${normalizedEmail}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Reject administrator users - they must use administrator login
    // Allow admin, user, doctor, lab, pharmacy, reception roles to use normal login
    if (user.role === 'administrator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Administrators must use the administrator login page' 
      });
    }
    
    // Validate role - only allow specific roles to login through this route
    const allowedRoles = ['user', 'admin', 'doctor', 'lab', 'pharmacy', 'reception'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid user role. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log(`Login attempt failed: Invalid password for user: ${user.email} (role: ${user.role})`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    console.log(`Login successful for user: ${user.email} (role: ${user.role})`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error during login', 
      error: error.message 
    });
  }
});

module.exports = router;

