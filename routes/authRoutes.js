const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
  try {
    const { phone, name, password } = req.body;
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(409).json({ error: 'Phone number already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ phone, name, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, phone: user.phone, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search user by phone number
router.get('/search', async (req, res) => {
  const { phone } = req.query;
  console.log(phone)
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.json({ user: null });
    res.json({ name: user.name, phone: user.phone });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
