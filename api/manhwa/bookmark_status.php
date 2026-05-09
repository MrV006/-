<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';

session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['is_bookmarked' => false]);
    exit;
}

$mangaId = intval($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT id FROM bookmarks WHERE user_id = ? AND manga_id = ?");
$stmt->execute([$_SESSION['user_id'], $mangaId]);
$bookmark = $stmt->fetch();

echo json_encode(['is_bookmarked' => $bookmark ? true : false]);
