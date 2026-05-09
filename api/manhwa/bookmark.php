<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$mangaId = intval($data['manga_id'] ?? 0);

if (!$mangaId) {
    echo json_encode(['error' => 'مانهوا یافت نشد']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM bookmarks WHERE user_id = ? AND manga_id = ?");
    $stmt->execute([$_SESSION['user_id'], $mangaId]);
    $bookmark = $stmt->fetch();

    if ($bookmark) {
        // remove bookmark
        $stmt = $pdo->prepare("DELETE FROM bookmarks WHERE id = ?");
        $stmt->execute([$bookmark['id']]);
        echo json_encode(['success' => true, 'is_bookmarked' => false]);
    } else {
        // add bookmark
        $stmt = $pdo->prepare("INSERT INTO bookmarks (user_id, manga_id) VALUES (?, ?)");
        $stmt->execute([$_SESSION['user_id'], $mangaId]);
        echo json_encode(['success' => true, 'is_bookmarked' => true]);
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'خطای دیتابیس']);
}
