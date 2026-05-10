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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') exit;

$title = $_POST['title'] ?? '';
$genres = $_POST['genres'] ?? '';
$desc = $_POST['description'] ?? '';

if (empty($title) || empty($desc)) {
    echo json_encode(['error' => 'تمامی فیلدها الزامی هستند']); exit;
}

if (!isset($_FILES['cover']) || $_FILES['cover']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'فایل کاور نامعتبر است']); exit;
}

$file = $_FILES['cover'];

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'webp'];
if (!in_array($ext, $allowed)) {
    echo json_encode(['error' => 'فرمت عکس مجاز نیست']); exit;
}

$uploadDir = __DIR__ . '/../../uploads/covers/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$newFileName = bin2hex(random_bytes(16)) . '.' . $ext;
$destPath = $uploadDir . $newFileName;

if (move_uploaded_file($file['tmp_name'], $destPath)) {
    $relativePath = 'uploads/covers/' . $newFileName;
    
    $stmt = $pdo->prepare("INSERT INTO mangas (title, description, cover_image, genres) VALUES (?, ?, ?, ?)");
    $stmt->execute([$title, $desc, $relativePath, $genres]);
    
    echo json_encode(['success' => true, 'message' => 'مانهوا با موفقیت ایجاد شد']);
} else {
    echo json_encode(['error' => 'خطا در آپلود عکس']);
}
