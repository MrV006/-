<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? 0;

$stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)");
$stmt->execute([$id, $_SESSION['user_id']]);
echo json_encode(['success' => true]);
