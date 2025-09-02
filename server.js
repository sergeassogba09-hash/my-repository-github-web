require('dotenv').config();
const express = require('express');
const uploadRoute = require('upload');
const videosRoute = require('videos');

const app = express();
app.use(express.json());

app.use('upload', uploadRoute);
app.use('videos', videosRoute);

app.listen(3000, () => console.log('✅ Serveur actif sur http://localhost:3000'));
