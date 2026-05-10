<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
if (!$user || !in_array($user['role'], ['admin', 'super_admin'])) {
    echo json_encode(['error' => 'Unauthorized']); exit;
}

$stmt = $pdo->query("SELECT id, user_id, chapter_id, original_name, role, file_path, created_at FROM staff_uploads WHERE status = 'pending' ORDER BY created_at DESC");
$uploads = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'uploads' => $uploads]);
