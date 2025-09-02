const express = require('express');
const router = express.Router();
const { getVideos } = require('videoModel');

router.get('/', async (req, res) => {
  try {
    const videos = await getVideos();
    res.status(200).json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;
