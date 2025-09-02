const express = require('express');
const router = express.Router();
const { uploadVideo } = require('videoController');

router.post('/', uploadVideo);
module.exports = router;
