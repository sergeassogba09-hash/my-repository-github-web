<?php
require_once 'neon.php';
header('Content-Type: application/json');

try {
  $pdo = connectToNeon();
  $stmt = $pdo->query("SELECT title, description, url FROM videos ORDER BY id DESC");
  $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($videos);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
