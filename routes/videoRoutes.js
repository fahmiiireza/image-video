const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authorize = require('../middleware/authMiddleware');

router.post('/', authorize, videoController.generateVideo);

module.exports = router;
