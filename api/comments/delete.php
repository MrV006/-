<?php
require_once __DIR__ . '/../security.php';
requireAdmin(); // admin or super_admin

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $commentId = intval($data['id'] ?? 0);
    
    if (!$commentId) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['success' => false, 'error' => 'شناسه کامنت نامعتبر']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
    if ($stmt->execute([$commentId])) {
        echo json_encode(['success' => true, 'message' => 'نظر با موفقیت حذف شد.']);
    } else {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(['success' => false, 'error' => 'خطا در حذف نظر']);
    }
    exit;
}

header('HTTP/1.1 405 Method Not Allowed');
