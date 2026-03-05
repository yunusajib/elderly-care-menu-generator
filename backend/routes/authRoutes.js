const express = require('express');
const { register, login, registerValidators, loginValidators } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post('/register', registerValidators, validateRequest, register);
router.post('/login', loginValidators, validateRequest, login);

module.exports = router;
