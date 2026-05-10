<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$stmt = $pdo->prepare("SELECT id, chapter_id, original_name, role, status, created_at FROM staff_uploads WHERE user_id = ? ORDER BY created_at DESC");
$stmt->execute([$_SESSION['user_id']]);
$uploads = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'uploads' => $uploads]);
