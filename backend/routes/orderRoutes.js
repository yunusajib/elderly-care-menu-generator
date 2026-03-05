const express = require('express');
const { body } = require('express-validator');
const { checkout, verifyPayment, myOrders } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post(
  '/checkout',
  protect,
  authorize('customer'),
  [
    body('deliveryOption').isIn(['home_delivery', 'pickup']),
    body('deliveryAddress').if(body('deliveryOption').equals('home_delivery')).notEmpty(),
    validateRequest,
  ],
  checkout
);
router.get('/verify/:reference', protect, verifyPayment);
router.get('/my-orders', protect, authorize('customer'), myOrders);

module.exports = router;
