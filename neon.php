<?php
function connectToNeon() {
  $config = require __DIR__ . 'config.php';
  $dsn = "pgsql:host={$config['db']['host']};port={$config['db']['port']};dbname={$config['db']['name']}";

  try {
    return new PDO($dsn, $config['db']['user'], $config['db']['pass'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
  } catch (PDOException $e) {
    throw new Exception("Erreur Neon : " . $e->getMessage());
  }
}
