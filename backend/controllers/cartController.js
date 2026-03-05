const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (req, res) => {
  let cart = await Cart.findOne({ customer: req.user._id }).populate('items.product');
  if (!cart) cart = await Cart.create({ customer: req.user._id, items: [] });
  res.json(cart);
};

const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const cart = (await Cart.findOne({ customer: req.user._id })) || (await Cart.create({ customer: req.user._id, items: [] }));
  const existing = cart.items.find((item) => item.product.toString() === productId);
  if (existing) existing.quantity += Number(quantity || 1);
  else cart.items.push({ product: productId, quantity: quantity || 1 });

  await cart.save();
  res.json(cart);
};

const removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ customer: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
  await cart.save();
  res.json(cart);
};

module.exports = { getCart, addToCart, removeFromCart };
