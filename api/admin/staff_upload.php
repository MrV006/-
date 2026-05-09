<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

// only super_admin or admin can access
$stmt = $pdo->prepare("SELECT role, id FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
if (!$user || !in_array($user['role'], ['admin', 'super_admin'])) {
    echo json_encode(['error' => 'Unauthorized']); exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') exit;

if (!isset($_FILES['file'])) {
    echo json_encode(['error' => 'فایلی انتخاب نشده است']); exit;
}

$chapterId = $_POST['chapter_id'] ?? 0;
$role = $_POST['role'] ?? ''; // translator, editor, cleaner
$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'خطا در آپلود']); exit;
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
if (strtolower($ext) !== 'webp') {
    echo json_encode(['error' => 'فقط فرمت webp مجاز است']); exit;
}

// Ensure upload directory exists
$uploadDir = __DIR__ . '/../../uploads/staff/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique file name
$uuid = bin2hex(random_bytes(16));
$newFileName = $uuid . '.webp';
$destPath = $uploadDir . $newFileName;

if (move_uploaded_file($file['tmp_name'], $destPath)) {
    $relativePath = 'uploads/staff/' . $newFileName;
    
    $stmt = $pdo->prepare("INSERT INTO staff_uploads (user_id, chapter_id, file_path, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$_SESSION['user_id'], $chapterId, $relativePath, $role]);
    
    // Also record their earnings
    $setStmt = $pdo->query("SELECT staff_chapter_reward FROM settings LIMIT 1");
    $settings = $setStmt->fetch();
    $reward = $settings ? $settings['staff_chapter_reward'] : 1;
    
    // Check if earnings record already exists to avoid duplicates? Or maybe they upload 1 zip per work.
    $stmt = $pdo->prepare("INSERT INTO staff_earnings (user_id, chapter_id, role, earned_amount) VALUES (?, ?, ?, ?)");
    // Earned amount left 0, chapters given directly or we just store an earning record
    $stmt->execute([$_SESSION['user_id'], $chapterId, $role, 0]);
    
    // Give them "gift chapters" by adding purchases according to reward amount, 
    // but the system doesn't know WHICH chapter they want. 
    // They usually select from a UI. For now, staff_earnings records their work, 
    // and dashboard calculates total gift chapters available.

    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'آپلود انجام نشد']);
}
