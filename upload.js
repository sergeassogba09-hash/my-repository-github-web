// 📦 Dépendances
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 🔐 Configuration Cloudinary
cloudinary.config({
  cloud_name: 'dsz7ngwow',
  api_key: '396915543459624',
  api_secret: 'pzZZhDRiY3Bf'
});

// 📁 Stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'e-tube',
    resource_type: 'video',
    format: 'mp4'
  }
});

const upload = multer({ storage });
const router = express.Router();

// 🚀 Route POST /upload
router.post('upload', upload.single('mediaFile'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });

  res.json({
    success: true,
    url: req.file.path,
    title: req.body.title,
    description: req.body.description
  });
});

module.exports = router;
