const express = require('express');
const { body } = require('express-validator');
const {
  getDashboard,
  approveVendor,
  getAllUsers,
  getAllOrders,
  setDeliveryCharge,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.patch('/vendors/:id/approve', approveVendor);
router.get('/users', getAllUsers);
router.get('/orders', getAllOrders);
router.patch('/delivery-charge', [body('amount').isFloat({ min: 0 }), validateRequest], setDeliveryCharge);

module.exports = router;
