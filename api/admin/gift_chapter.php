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

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['user_id'] ?? 0;
$chapterId = $data['chapter_id'] ?? 0;

if (!$userId || !$chapterId) {
    echo json_encode(['error' => 'شناسه کاربر و چپتر الزامی است']); exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO purchases (user_id, chapter_id) VALUES (?, ?)");
    $stmt->execute([$userId, $chapterId]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => 'کاربر قبلا این چپتر را دارد یا چپتر وجود ندارد.']);
}
