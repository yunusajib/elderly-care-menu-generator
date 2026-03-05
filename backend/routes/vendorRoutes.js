const express = require('express');
const { body } = require('express-validator');
const {
  getVendorProfile,
  addProduct,
  listVendorProducts,
  updateProduct,
  deleteProduct,
  getVendorOrders,
  getVendorDashboard,
} = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();
router.use(protect, authorize('vendor'));

const productValidator = [
  body('name').notEmpty(),
  body('description').notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('category').notEmpty(),
  body('stockQuantity').isInt({ min: 0 }),
];

router.get('/profile', getVendorProfile);
router.get('/dashboard', getVendorDashboard);
router.get('/orders', getVendorOrders);
router.get('/products', listVendorProducts);
router.post('/products', upload.array('images', 5), productValidator, validateRequest, addProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
