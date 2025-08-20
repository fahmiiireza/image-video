const express = require('express');
const router = express.Router();
const authorize = require('../middleware/authMiddleware');
const paymentsController = require('../controllers/paymentsController');

router.post('/generate', paymentsController.generatePayment);

router.post('/verify', paymentsController.verifyPayment);

module.exports = router;
