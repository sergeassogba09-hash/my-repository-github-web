<?php
return [
  'db' => [
    'host' => getenv('DB_HOST'),
    'name' => getenv('DB_NAME'),
    'user' => getenv('DB_USER'),
    'pass' => getenv('DB_PASS'),
    'port' => getenv('DB_PORT')
  ],
  'cloudinary' => [
    'cloud_name' => getenv('CLOUDINARY_CLOUD_NAME'),
    'api_key'    => getenv('CLOUDINARY_API_KEY'),
    'api_secret' => getenv('CLOUDINARY_API_SECRET')
  ]
];
