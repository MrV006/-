<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') exit;

if (!isset($_FILES['file'])) {
    echo json_encode(['error' => 'فایلی انتخاب نشده است']); exit;
}

$chapterId = intval($_POST['chapter_id'] ?? 0);
$role = $_POST['role'] ?? ''; 
$file = $_FILES['file'];

if (!$chapterId) {
    echo json_encode(['error' => 'ID چپتر نامعتبر است']); exit;
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'خطا در آپلود']); exit;
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if ($role === 'translator' && !in_array($ext, ['doc', 'docx'])) {
    echo json_encode(['error' => 'مترجم فقط مجاز به ارسال فایل ورد (doc/docx) است']); exit;
}
if (($role === 'cleaner' || $role === 'editor') && !in_array($ext, ['webp', 'jpg', 'jpeg', 'png', 'zip'])) {
    echo json_encode(['error' => 'کلینر/ادیتور مجاز به آپلود webp/jpg/zip می‌باشد']); exit;
}

// Ensure upload directory exists
$uploadDir = __DIR__ . '/../../uploads/staff_work/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique file name
$uuid = bin2hex(random_bytes(16));
$newFileName = $uuid . '.' . $ext;
$destPath = $uploadDir . $newFileName;

if (move_uploaded_file($file['tmp_name'], $destPath)) {
    $relativePath = 'uploads/staff_work/' . $newFileName;
    $originalName = $file['name'];
    
    // Add to staff uploads table waiting for approval
    $stmt = $pdo->prepare("INSERT INTO staff_uploads (user_id, chapter_id, file_path, role, status, original_name) VALUES (?, ?, ?, ?, 'pending', ?)");
    $stmt->execute([$_SESSION['user_id'], $chapterId, $relativePath, $role, $originalName]);
    
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'آپلود در سرور انجام نشد']);
}
