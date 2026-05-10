<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth(); // Adjust based on your strategy

if (!isset($_GET['chapter_id'])) {
    header('HTTP/1.1 400 Bad Request');
    exit;
}

$chapterId = intval($_GET['chapter_id']);

// 1. Check Access
if ($_SESSION['user_role'] !== 'admin' && $_SESSION['user_role'] !== 'super_admin') {
    $stmt = $pdo->prepare("SELECT COUNT(id) FROM purchases WHERE user_id = ? AND chapter_id = ?");
    $stmt->execute([$_SESSION['user_id'], $chapterId]);
    $hasAccess = $stmt->fetchColumn() > 0;

    if (!$hasAccess) {
        $chStmt = $pdo->prepare("SELECT price FROM chapters WHERE id = ?");
        $chStmt->execute([$chapterId]);
        $chPrice = $chStmt->fetchColumn();
        if ($chPrice > 0) {
            echo json_encode(['error' => 'You need to purchase this chapter']);
            exit;
        }
    }
}

// 2. Count images in the directory
$dirPath = __DIR__ . "/../../uploads/chapters/chap_{$chapterId}/";
$pages = [];

if (is_dir($dirPath)) {
    $files = scandir($dirPath);
    foreach ($files as $file) {
        if (in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'webp'])) {
            $pages[] = $file;
        }
    }
}

// Sort logically to ensure page_1, page_2, page_10 are correctly ordered
natsort($pages);
$pages = array_values($pages);

echo json_encode(['success' => true, 'total_pages' => count($pages), 'pages' => $pages]);
