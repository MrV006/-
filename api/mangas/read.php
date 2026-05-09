<?php
require_once __DIR__ . '/../security.php';
requireAuth(); // Anoymous cannot view chapters

if (!isset($_GET['chapter_id']) || !isset($_GET['page'])) {
    header('HTTP/1.1 400 Bad Request');
    exit;
}

$chapterId = intval($_GET['chapter_id']);
$pageNum = intval($_GET['page']);

// 1. Check if user is either Admin or Purchaser of the chapter
if ($_SESSION['user_role'] !== 'admin') {
    $stmt = $pdo->prepare("SELECT COUNT(id) FROM purchases WHERE user_id = ? AND chapter_id = ?");
    $stmt->execute([$_SESSION['user_id'], $chapterId]);
    $hasAccess = $stmt->fetchColumn() > 0;

    if (!$hasAccess) {
        header('HTTP/1.1 403 Forbidden');
        exit;
    }
}

// 2. Fetch the target file path safely
// Warning: In production, paths should be fetched securely from DB or rigidly structured mappings.
// Using rigid mapping here to prevent Path Traversal Attacks (LFI)
$safePageNum = preg_replace('/[^0-9]/', '', $pageNum); // Sanitize page number to numbers ONLY
$filePath = __DIR__ . "/../../uploads/chapters/chap_{$chapterId}/page_{$safePageNum}.jpg";

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
