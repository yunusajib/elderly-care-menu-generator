const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Vendor = require('../models/Vendor');
const Setting = require('../models/Setting');
const paystack = require('../config/paystack');

const checkout = async (req, res) => {
  const { deliveryOption, deliveryAddress } = req.body;
  const cart = await Cart.findOne({ customer: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

  const deliveryConfig = await Setting.findOne({ key: 'deliveryCharge' });
  const deliveryFee = deliveryOption === 'home_delivery' ? Number(deliveryConfig?.value || 0) : 0;

  let subtotal = 0;
  const itemDocs = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);
    if (!product || product.stockQuantity < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for ${item.product.name}` });
    }

    const itemSubtotal = product.price * item.quantity;
    subtotal += itemSubtotal;

    const orderItem = await OrderItem.create({
      product: product._id,
      vendor: product.vendor,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal: itemSubtotal,
    });

    product.stockQuantity -= item.quantity;
    if (product.stockQuantity === 0) product.availabilityStatus = 'out_of_stock';
    await product.save();

    itemDocs.push(orderItem._id);
  }

  const totalPrice = subtotal + deliveryFee;

  const order = await Order.create({
    customer: req.user._id,
    orderItems: itemDocs,
    totalPrice,
    deliveryOption,
    deliveryFee,
    deliveryAddress: deliveryOption === 'home_delivery' ? deliveryAddress : '',
    paymentStatus: 'pending',
  });

  cart.items = [];
  await cart.save();

  const response = await paystack.post('/transaction/initialize', {
    email: req.user.email,
    amount: Math.round(totalPrice * 100),
    reference: `SH-${order._id}-${Date.now()}`,
    callback_url: process.env.PAYSTACK_CALLBACK_URL,
    metadata: { orderId: order._id.toString() },
  });

  order.paymentReference = response.data?.data?.reference;
  await order.save();

  res.status(201).json({ order, payment: response.data.data });
};

const verifyPayment = async (req, res) => {
  const { reference } = req.params;
  const verify = await paystack.get(`/transaction/verify/${reference}`);

  const order = await Order.findOne({ paymentReference: reference });
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (verify.data.data.status === 'success') {
    order.paymentStatus = 'paid';
    order.orderStatus = 'processing';
  } else {
    order.paymentStatus = 'failed';
  }

  await order.save();
  res.json({ order, paystack: verify.data.data });
};

const myOrders = async (req, res) => {
  const orders = await Order.find({ customer: req.user._id }).populate('orderItems').sort({ createdAt: -1 });
  res.json(orders);
};

module.exports = { checkout, verifyPayment, myOrders };
