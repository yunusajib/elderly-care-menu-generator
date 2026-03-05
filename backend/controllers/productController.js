const Product = require('../models/Product');

const listProducts = async (req, res) => {
  const query = {};
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  if (req.query.category) query.category = req.query.category;

  const products = await Product.find(query).populate({ path: 'vendor', populate: { path: 'user', select: 'fullName' } });
  res.json(products);
};

const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('vendor');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

module.exports = { listProducts, getProduct };
