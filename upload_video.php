<?php
require_once 'neon.php';
require_once 'cloudinary.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $title = $_POST['title'] ?? '';
  $description = $_POST['description'] ?? '';
  $file = $_FILES['mediaFile'] ?? null;

  if (!$file || $file['type'] !== 'video/mp4') {
    echo json_encode(['error' => '⚠️ Fichier invalide']);
    exit;
  }

  try {
    $upload = uploadToCloudinary($file['tmp_name'], $title);
    $url = $upload['secure_url'];

    $pdo = connectToNeon();
    $stmt = $pdo->prepare("INSERT INTO videos (title, description, url) VALUES (?, ?, ?)");
    $stmt->execute([$title, $description, $url]);

    echo json_encode(['success' => true, 'url' => $url]);
  } catch (Exception $e) {
    echo json_encode(['error' => '❌ ' . $e->getMessage()]);
  }
}
