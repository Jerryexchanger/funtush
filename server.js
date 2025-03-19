const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const expressSession = require('express-session');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSession({ secret: process.env.SECRET_KEY, resave: false, saveUninitialized: true }));

// User Model
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// Register Route
app.post('/register', [
  body('email').isEmail().withMessage('Enter a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login Route
app.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    req.session.user = user;
    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Escrow and Web3 Setup
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://api.trongrid.io'));

const escrowContract = new web3.eth.Contract([], 'YOUR_CONTRACT_ADDRESS'); // Replace with actual contract address

// Routes for placing bids and interacting with USDT escrow
app.post('/place-bid', (req, res) => {
  // Bid logic
  const { buyerAddress, sellerAddress, amount } = req.body;
  res.send('Bid placed successfully');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
