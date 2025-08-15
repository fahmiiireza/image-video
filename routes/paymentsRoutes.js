const express = require('express');
const router = express.Router();
const authorize = require('../middleware/authMiddleware');
const paymentsController = require('../controllers/paymentsController');

router.post('/', authorize, paymentsController.generatePayment);

module.exports = router;
