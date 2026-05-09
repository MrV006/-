<?php
require_once __DIR__ . '/../security.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) {
    header('HTTP/1.1 400 Bad Request');
    exit;
}

$stmt = $pdo->prepare("SELECT id, title, description, cover_image FROM mangas WHERE id = ?");
$stmt->execute([$id]);
$manga = $stmt->fetch();

if (!$manga) {
    header('HTTP/1.1 404 Not Found');
    exit;
}

// Global settings for baseline pricing and bulk discounts
$settingStmt = $pdo->query("SELECT base_price, bulk_discount_percent FROM settings ORDER BY id DESC LIMIT 1");
$settings = $settingStmt->fetch();

$stmt = $pdo->prepare("SELECT id, chapter_number, title, price FROM chapters WHERE manga_id = ? ORDER BY chapter_number ASC");
$stmt->execute([$id]);
$chapters = $stmt->fetchAll();

foreach ($chapters as &$c) {
    // Determine dynamic price. If a manual price was set in chapters table > 0, use it. Else fallback to base_price.
    $effectivePrice = (floatval($c['price']) > 0) ? floatval($c['price']) : floatval($settings['base_price']);
    $c['effective_price'] = $effectivePrice;
}

// Determine Ownership if user is logged in
$purchased = [];
if (isset($_SESSION['user_id'])) {
    $pStmt = $pdo->prepare("SELECT chapter_id FROM purchases WHERE user_id = ?");
    $pStmt->execute([$_SESSION['user_id']]);
    $purchased = $pStmt->fetchAll(PDO::FETCH_COLUMN); // Returns array of IDs like [1, 5, 8]
}

echo json_encode([
    'manga' => $manga,
    'chapters' => $chapters,
    'settings' => $settings,
    'user_purchased_chapters' => $purchased
]);
