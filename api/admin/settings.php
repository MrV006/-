<?php
require_once __DIR__ . '/../security.php';
requireSuperAdmin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // added staff_chapter_reward query fallback if missing, assuming setup_db altered it
    $stmt = $pdo->query("SELECT * FROM settings ORDER BY id DESC LIMIT 1");
    $settings = $stmt->fetch();
    echo json_encode(['settings' => $settings]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $basePrice = floatval($data['base_price'] ?? 0);
    $bulkDiscount = intval($data['bulk_discount_percent'] ?? 0);
    $giftAmount = floatval($data['gift_amount'] ?? 0);
    $staffChapterReward = intval($data['staff_chapter_reward'] ?? 1);
    $recruitContact = $data['recruitment_contact'] ?? '@YourID';
    $recruitFile = $data['recruitment_file_path'] ?? '/downloads/test-file.zip';
    $footerText = $data['footer_text'] ?? '';
    $rulesText = $data['rules_text'] ?? '';
    $zarinpalEnabled = intval($data['zarinpal_enabled'] ?? 0);
    $zarinpalMerchant = $data['zarinpal_merchant_id'] ?? '';
    
    // Server-side validations to ensure no negative/manipulated values break the shop
    if ($basePrice < 0 || $bulkDiscount < 0 || $bulkDiscount > 100 || $giftAmount < 0 || $staffChapterReward < 0) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['error' => 'مقادیر وارد شده نامعتبر است.']);
        exit;
    }
    
    // Using a dynamic check in case someone runs this before setup_db
    try {
        $stmt = $pdo->prepare("UPDATE settings SET base_price = ?, bulk_discount_percent = ?, gift_amount = ?, staff_chapter_reward = ?, recruitment_contact = ?, recruitment_file_path = ?, footer_text = ?, rules_text = ?, zarinpal_enabled = ?, zarinpal_merchant_id = ?");
        $stmt->execute([$basePrice, $bulkDiscount, $giftAmount, $staffChapterReward, $recruitContact, $recruitFile, $footerText, $rulesText, $zarinpalEnabled, $zarinpalMerchant]);
        echo json_encode(['message' => 'تنظیمات با موفقیت به‌روزرسانی شد.']);
    } catch (Exception $e) {
        // Fallback for older schema
        $stmt = $pdo->prepare("UPDATE settings SET base_price = ?, bulk_discount_percent = ?, gift_amount = ?, recruitment_contact = ?, recruitment_file_path = ?");
        $stmt->execute([$basePrice, $bulkDiscount, $giftAmount, $recruitContact, $recruitFile]);
        echo json_encode(['message' => 'تنظیمات پایه ذخیره شد. برای بقیه باید دیتابیس را آپدیت کنید.']);
    }
} else {
    header('HTTP/1.1 405 Method Not Allowed');
}
