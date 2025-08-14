const express = require('express');
const router = express.Router();
const shortenerController = require('../controllers/shortenerController');

router.post('/', shortenerController.createShortLink);
router.get('/:slug', shortenerController.redirectShortLink);

module.exports = router;
