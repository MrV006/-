<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

$mangaId = intval($_GET['id'] ?? 0);
if (!$mangaId) {
    echo json_encode(['error' => 'ID نامعتبر']); exit;
}

$stmt = $pdo->prepare("SELECT id, title, description, cover_image, genres, created_at FROM mangas WHERE id = ?");
$stmt->execute([$mangaId]);
$manga = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$manga) {
    echo json_encode(['error' => 'مانهوا یافت نشد']); exit;
}

// ensure genres is not null
$manga['genres'] = $manga['genres'] ? explode(',', $manga['genres']) : [];

// get chapters safely
$stmt = $pdo->prepare("SELECT id, chapter_number as number, title, price, created_at FROM chapters WHERE manga_id = ? ORDER BY chapter_number ASC");
$stmt->execute([$mangaId]);
$manga['chapters'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'manga' => $manga]);
