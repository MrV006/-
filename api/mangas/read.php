<?php
require_once __DIR__ . '/../security.php';
requireAuth(); // Anoymous cannot view chapters

if (!isset($_GET['chapter_id']) || !isset($_GET['file'])) {
    header('HTTP/1.1 400 Bad Request');
    exit;
}

$chapterId = intval($_GET['chapter_id']);
$fileName = basename($_GET['file']); // VERY IMPORTANT: Basename to prevent LFI !

// 1. Check if user is either Admin or Purchaser of the chapter
if ($_SESSION['user_role'] !== 'admin' && $_SESSION['user_role'] !== 'super_admin') {
    $stmt = $pdo->prepare("SELECT COUNT(id) FROM purchases WHERE user_id = ? AND chapter_id = ?");
    $stmt->execute([$_SESSION['user_id'], $chapterId]);
    $hasAccess = $stmt->fetchColumn() > 0;

    if (!$hasAccess) {
        $chStmt = $pdo->prepare("SELECT price FROM chapters WHERE id = ?");
        $chStmt->execute([$chapterId]);
        if ($chStmt->fetchColumn() > 0) {
            header('HTTP/1.1 403 Forbidden');
            exit;
        }
    }
}

// 2. Fetch the target file path safely
$filePath = __DIR__ . "/../../uploads/chapters/chap_{$chapterId}/{$fileName}";

if (!file_exists($filePath)) {
    // Return standard Not Found or a placeholder image
    header('HTTP/1.1 404 Not Found');
    exit;
}

// 3. SECURE Anti-Cache and Content Streaming Headers
header('Content-Description: File Transfer');
header('Content-Type: image/jpeg');

// Critical Anti-Caching Headers (Browser + Proxy levels)
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT'); // Force expiration instantly

// Stream file memory-efficiently
readfile($filePath);
exit;
