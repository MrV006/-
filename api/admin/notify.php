<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

requireSuperAdmin();

$data = json_decode(file_get_contents('php://input'), true);
$userId = !empty($data['user_id']) ? intval($data['user_id']) : null;
$message = $data['message'] ?? '';
$isPopup = !empty($data['is_popup']) ? 1 : 0;

if (empty($message)) {
    echo json_encode(['error' => 'متن پیام الزامی است']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, message, is_popup) VALUES (?, ?, ?)");
    $stmt->execute([$userId, $message, $isPopup]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => 'خطای دیتابیس']);
}
