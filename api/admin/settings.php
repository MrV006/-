<?php
require_once __DIR__ . '/../security.php';
requireSuperAdmin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT base_price, bulk_discount_percent, gift_amount, recruitment_contact, recruitment_file_path FROM settings ORDER BY id DESC LIMIT 1");
    $settings = $stmt->fetch();
    echo json_encode(['settings' => $settings]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $basePrice = floatval($data['base_price'] ?? 0);
    $bulkDiscount = intval($data['bulk_discount_percent'] ?? 0);
    $giftAmount = floatval($data['gift_amount'] ?? 0);
    $recruitContact = $data['recruitment_contact'] ?? '@YourID';
    $recruitFile = $data['recruitment_file_path'] ?? '/downloads/test-file.zip';
    
    // Server-side validations to ensure no negative/manipulated values break the shop
    if ($basePrice < 0 || $bulkDiscount < 0 || $bulkDiscount > 100 || $giftAmount < 0) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['error' => 'مقادیر وارد شده نامعتبر است.']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE settings SET base_price = ?, bulk_discount_percent = ?, gift_amount = ?, recruitment_contact = ?, recruitment_file_path = ?");
    if ($stmt->execute([$basePrice, $bulkDiscount, $giftAmount, $recruitContact, $recruitFile])) {
        echo json_encode(['message' => 'تنظیمات با موفقیت به‌روزرسانی شد.']);
    } else {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(['error' => 'خطا در ذخیره‌سازی تنظیمات.']);
    }
} else {
    header('HTTP/1.1 405 Method Not Allowed');
}
