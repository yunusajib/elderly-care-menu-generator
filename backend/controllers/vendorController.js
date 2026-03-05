const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

const getVendorProfile = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });
  res.json(vendor);
};

const addProduct = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id, approvalStatus: 'approved' });
  if (!vendor) return res.status(403).json({ message: 'Vendor not approved' });

  const images = (req.files || []).map((file) => file.path);
  const product = await Product.create({ ...req.body, vendor: vendor._id, images });
  res.status(201).json(product);
};

const listVendorProducts = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  const products = await Product.find({ vendor: vendor._id });
  res.json(products);
};

const updateProduct = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendor: vendor._id },
    { ...req.body },
    { new: true }
  );
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

const deleteProduct = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  const product = await Product.findOneAndDelete({ _id: req.params.id, vendor: vendor._id });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Deleted successfully' });
};

const getVendorOrders = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  const items = await OrderItem.find({ vendor: vendor._id }).select('_id');
  const orders = await Order.find({ orderItems: { $in: items.map((i) => i._id) } }).sort({ createdAt: -1 });
  res.json(orders);
};

const getVendorDashboard = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  const [products, itemAgg] = await Promise.all([
    Product.find({ vendor: vendor._id }),
    OrderItem.aggregate([
      { $match: { vendor: vendor._id } },
      { $group: { _id: null, revenue: { $sum: '$subtotal' } } },
    ]),
  ]);

  res.json({
    products,
    revenue: itemAgg[0]?.revenue || 0,
  });
};

module.exports = {
  getVendorProfile,
  addProduct,
  listVendorProducts,
  updateProduct,
  deleteProduct,
  getVendorOrders,
  getVendorDashboard,
};
