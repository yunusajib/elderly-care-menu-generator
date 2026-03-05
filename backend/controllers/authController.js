const { body } = require('express-validator');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { signToken } = require('../utils/token');

const registerValidators = [
  body('fullName').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['customer', 'vendor']),
];

const register = async (req, res) => {
  const { fullName, email, password, phone, role, shopName, shopAddress } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already exists' });

  const user = await User.create({ fullName, email, password, phone, role: role || 'customer' });

  if (user.role === 'vendor') {
    await Vendor.create({ user: user._id, shopName, shopAddress });
  }

  const token = signToken(user._id);
  return res.status(201).json({ token, user: { id: user._id, fullName, email, role: user.role } });
};

const loginValidators = [body('email').isEmail(), body('password').notEmpty()];

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken(user._id);
  return res.json({
    token,
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
  });
};

module.exports = { register, login, registerValidators, loginValidators };
