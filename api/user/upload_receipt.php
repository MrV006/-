<?php
require_once __DIR__ . '/../security.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 405 Method Not Allowed');
    exit;
}

if (!isset($_FILES['receipt_image']) || !isset($_POST['amount'])) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'تصویر فیش و مبلغ الزامی است.']);
    exit;
}

$amount = floatval($_POST['amount']);
if ($amount < 1000) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'مبلغ وارد شده باید حداقل ۱۰۰۰ تومان باشد.']);
    exit;
}

$file = $_FILES['receipt_image'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'webp'];

if (!in_array($ext, $allowed)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'فرمت فایل مجاز نیست. فقط تصاویر پذیرفته می‌شوند.']);
    exit;
}

if ($file['size'] > 5 * 1024 * 1024) { // 5MB MAX Size to prevent storage exhaustion
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'حجم فایل نباید بیشتر از ۵ مگابایت باشد.']);
    exit;
}

// Ensure dir exists securely
$uploadDir = __DIR__ . '/../../uploads/receipts/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
    // Secure the directory against script execution if Apache is poorly configured
    file_put_contents($uploadDir . '.htaccess', "<Files *.*>\nDeny from all\n</Files>\n<FilesMatch \"\.(jpg|jpeg|png|webp)$\">\nAllow from all\n</FilesMatch>\nphp_flag engine off");
}

$newFileName = 'rec_' . $_SESSION['user_id'] . '_' . uniqid() . '.' . $ext;
$destination = $uploadDir . $newFileName;

if (move_uploaded_file($file['tmp_name'], $destination)) {
    // 1. Enter receipt into database logic
    $stmt = $pdo->prepare("INSERT INTO receipts (user_id, image_path, amount) VALUES (?, ?, ?)");
    $dbPath = 'uploads/receipts/' . $newFileName;
    $stmt->execute([$_SESSION['user_id'], $dbPath, $amount]);
    
    echo json_encode(['message' => 'فیش شما با موفقیت ارسال شد و در انتظار تایید است.']);
} else {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'خطا در ذخیره‌سازی فایل رخ داد.']);
}
