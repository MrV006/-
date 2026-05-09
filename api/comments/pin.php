<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

requireSuperAdmin(); // Assuming requireSuperAdmin function exists or just use standard check

// Wait, the path is api/comments/pin.php
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
if (!$user || $user['role'] !== 'super_admin') {
    echo json_encode(['error' => 'مجاز نیست']); exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? 0;
$pin = $data['pin'] ?? 0;

try {
    $stmt = $pdo->prepare("UPDATE comments SET is_pinned = ? WHERE id = ?");
    $stmt->execute([$pin, $id]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => 'خطای دیتابیس']);
}
