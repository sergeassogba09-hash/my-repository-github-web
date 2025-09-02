const cloudinary = require('cloudinary');
const { insertVideo } = require('videoModel');

async function uploadVideo(req, res) {
  const { title, base64 } = req.body;
  if (!title || !base64) return res.status(400).json({ error: 'Données manquantes' });

  try {
    const result = await cloudinary.uploader.upload(base64, { resource_type: 'video' });
    await insertVideo({ title, url: result.secure_url });
    res.status(200).json({ message: 'Vidéo enregistrée', url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
}

module.exports = { uploadVideo };
