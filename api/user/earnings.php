<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$stmt = $pdo->prepare("
    SELECT e.*, c.chapter_number, m.title as manga_title 
    FROM staff_earnings e 
    JOIN chapters c ON e.chapter_id = c.id 
    JOIN mangas m ON c.manga_id = m.id 
    WHERE e.user_id = ? 
    ORDER BY e.created_at DESC
");
$stmt->execute([$_SESSION['user_id']]);
$history = $stmt->fetchAll();

if (empty($history)) {
    echo json_encode(['is_staff' => false]);
    exit;
}

$totalAmt = 0;
foreach($history as $item) $totalAmt += (float)$item['earned_amount'];

$setStmt = $pdo->query("SELECT staff_chapter_reward FROM settings LIMIT 1");
$settings = $setStmt->fetch();
$reward = $settings ? $settings['staff_chapter_reward'] : 1;

echo json_encode([
    'is_staff' => true,
    'total_amount' => $totalAmt,
    'gift_chapters' => count($history) * $reward,
    'history' => $history
]);
