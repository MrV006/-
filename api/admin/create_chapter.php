<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

requireSuperAdmin();

$data = json_decode(file_get_contents('php://input'), true);
$mangaId = intval($data['manga_id'] ?? 0);
$chapterNumber = floatval($data['chapter_number'] ?? 0);
$chapterTitle = $data['title'] ?? ('چپتر ' . $chapterNumber);
$price = isset($data['price']) && $data['price'] !== '' ? floatval($data['price']) : null;

if (!$mangaId || !$chapterNumber) {
    echo json_encode(['error' => 'اطلاعات نامعتبر است']); exit;
}

// create chapter
$stmt = $pdo->prepare("INSERT INTO chapters (manga_id, chapter_number, title, price) VALUES (?, ?, ?, ?)");
$stmt->execute([$mangaId, $chapterNumber, $chapterTitle, $price]);
$chapterId = $pdo->lastInsertId();

// Ensure manga exists to get title
$stmt = $pdo->prepare("SELECT title FROM mangas WHERE id = ?");
$stmt->execute([$mangaId]);
$manga = $stmt->fetch();
$mangaName = $manga ? $manga['title'] : "عنوان نامشخص";

// Notify all bookmarked users
$stmt = $pdo->prepare("SELECT user_id FROM bookmarks WHERE manga_id = ?");
$stmt->execute([$mangaId]);
$users = $stmt->fetchAll(PDO::FETCH_COLUMN);

$message = "یک چپتر جدید برای $mangaName منتشر شد: چپتر $chapterNumber";

$notifyStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, is_popup, link) VALUES (?, ?, 0, ?)");
$link = "/reader.html?chapter=" . $chapterId;

foreach ($users as $u) {
    $notifyStmt->execute([$u, $message, $link]);
}

echo json_encode(['success' => true, 'message' => 'چپتر با موفقیت اضافه شد و نوتیفیکیشن‌ها ارسال شد']);
