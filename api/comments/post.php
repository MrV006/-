<?php
require_once __DIR__ . '/../security.php';
requireAuth(); // Must be logged in

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $mangaId = intval($data['manga_id'] ?? 0);
    $content = trim($data['content'] ?? '');
    
    if (!$mangaId || empty($content)) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['success' => false, 'error' => 'محتوای کامنت و شناسه مانهوا الزامی است.']);
        exit;
    }
    
    if (strlen($content) > 1000) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['success' => false, 'error' => 'متن نظر طولانی‌تر از حد مجاز است.']);
        exit;
    }
    
    $stmt = $pdo->prepare("INSERT INTO comments (user_id, manga_id, content, status) VALUES (?, ?, ?, 'approved')"); // default approved, admin can delete later
    if ($stmt->execute([$_SESSION['user_id'], $mangaId, $content])) {
        echo json_encode(['success' => true, 'message' => 'نظر شما با موفقیت ثبت شد.']);
    } else {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(['success' => false, 'error' => 'خطا در ثبت نظر']);
    }
    exit;
}

header('HTTP/1.1 405 Method Not Allowed');
