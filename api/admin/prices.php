<?php
require_once __DIR__ . '/../security.php';
requireSuperAdmin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $chapterId = intval($data['chapter_id'] ?? 0);
    // if price is exactly null or empty string we keep it null to use base_price, otherwise float
    if (!isset($data['price']) || $data['price'] === null || $data['price'] === '') {
        $price = null;
    } else {
        $price = floatval($data['price']);
        if ($price < 0) $price = 0;
    }
    
    if (!$chapterId) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['success' => false, 'error' => 'شناسه چپتر نامعتبر']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE chapters SET price = ? WHERE id = ?");
    if ($stmt->execute([$price, $chapterId])) {
        echo json_encode(['success' => true, 'message' => 'قیمت چپتر با موفقیت تغییر کرد.']);
    } else {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(['success' => false, 'error' => 'خطا در بروزرسانی قیمت']);
    }
    exit;
}

header('HTTP/1.1 405 Method Not Allowed');
