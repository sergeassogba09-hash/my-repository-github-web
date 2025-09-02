<?php
function uploadToCloudinary($filePath, $publicId = null) {
  $config = require __DIR__ . 'config.php';
  $url = "https://api.cloudinary.com/v1_1/{$config['cloudinary']['cloud_name']}/video/upload";

  $data = [
    'file' => new CURLFile($filePath),
    'upload_preset' => 'default',
    'public_id' => $publicId
  ];

  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_USERPWD => "{$config['cloudinary']['api_key']}:{$config['cloudinary']['api_secret']}",
    CURLOPT_POSTFIELDS => $data
  ]);

  $response = curl_exec($ch);
  if (curl_errno($ch)) throw new Exception('Cloudinary : ' . curl_error($ch));
  curl_close($ch);

  return json_decode($response, true);
}
