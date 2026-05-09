<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

requireSuperAdmin();

$data = json_decode(file_get_contents('php://input'), true);
$mangaId = intval($data['manga_id'] ?? 0);
$chapterTitle = $data['title'] ?? 'چپتر جدید';

if (!$mangaId) {
    echo json_encode(['error' => 'Invalid manga']); exit;
}

// Ensure manga exists, if not just assume it exists for mockup
$stmt = $pdo->prepare("SELECT title FROM mangas WHERE id = ?");
$stmt->execute([$mangaId]);
$manga = $stmt->fetch();
$mangaName = $manga ? $manga['title'] : "مانهوا با شناسه $mangaId";

// Notify all bookmarked users
$stmt = $pdo->prepare("SELECT user_id FROM bookmarks WHERE manga_id = ?");
$stmt->execute([$mangaId]);
$users = $stmt->fetchAll(PDO::FETCH_COLUMN);

$message = "یک چپتر جدید برای $mangaName منتشر شد: $chapterTitle";

$notifyStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, is_popup) VALUES (?, ?, 0)");

foreach ($users as $u) {
    $notifyStmt->execute([$u, $message]);
}

echo json_encode(['success' => true, 'notified' => count($users)]);
