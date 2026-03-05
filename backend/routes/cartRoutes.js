const express = require('express');
const { body } = require('express-validator');
const { getCart, addToCart, removeFromCart } = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();
router.use(protect, authorize('customer'));

router.get('/', getCart);
router.post(
  '/',
  [body('productId').isMongoId(), body('quantity').optional().isInt({ min: 1 }), validateRequest],
  addToCart
);
router.delete('/:productId', removeFromCart);

module.exports = router;
