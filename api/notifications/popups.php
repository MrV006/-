<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../security.php';
requireAuth();

$stmt = $pdo->prepare("SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0 AND is_popup = 1 ORDER BY created_at DESC");
$stmt->execute([$_SESSION['user_id']]);
echo json_encode(['popups' => $stmt->fetchAll()]);
