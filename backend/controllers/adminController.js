const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Setting = require('../models/Setting');

const getDashboard = async (req, res) => {
  const [vendors, products, orders, revenueAgg] = await Promise.all([
    Vendor.countDocuments({ approvalStatus: 'approved' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' } } },
    ]),
  ]);

  res.json({
    vendors,
    products,
    orders,
    revenue: revenueAgg[0]?.revenue || 0,
  });
};

const approveVendor = async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(
    req.params.id,
    { approvalStatus: 'approved', approvedAt: new Date() },
    { new: true }
  );
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  res.json(vendor);
};

const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

const getAllOrders = async (req, res) => {
  const orders = await Order.find().populate('customer', 'fullName email').sort({ createdAt: -1 });
  res.json(orders);
};

const setDeliveryCharge = async (req, res) => {
  const { amount } = req.body;
  const setting = await Setting.findOneAndUpdate(
    { key: 'deliveryCharge' },
    { key: 'deliveryCharge', value: amount },
    { upsert: true, new: true }
  );
  res.json(setting);
};

module.exports = {
  getDashboard,
  approveVendor,
  getAllUsers,
  getAllOrders,
  setDeliveryCharge,
};
