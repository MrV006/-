<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
if (!$user || !in_array($user['role'], ['admin', 'super_admin'])) {
    echo json_encode(['error' => 'Unauthorized']); exit;
}

try {
    // Analytics
    $revStmt = $pdo->query("
        SELECT COALESCE(SUM(c.price), 0) as total_revenue
        FROM purchases p
        JOIN chapters c ON p.chapter_id = c.id
    "); // Wait, chapter price could be null, if so base price. Let's keep it simple for now, we assume c.price holds the actual paid amount or base price.

    // A better approach using IFNULL:
    $settingsStmt = $pdo->query("SELECT base_price FROM settings LIMIT 1");
    $settings = $settingsStmt->fetch();
    $basePrice = $settings ? $settings['base_price'] : 0;

    $revStmt = $pdo->query("
        SELECT COALESCE(SUM(IFNULL(c.price, $basePrice)), 0) as total_revenue,
               COUNT(*) as total_chapters_sold
        FROM purchases p
        JOIN chapters c ON p.chapter_id = c.id
    ");
    $stats = $revStmt->fetch();
    
    // Group by manga
    $mangaStmt = $pdo->query("
        SELECT m.title as title, COUNT(p.id) as sales, COALESCE(SUM(IFNULL(c.price, $basePrice)), 0) as revenue
        FROM purchases p
        JOIN chapters c ON p.chapter_id = c.id
        JOIN mangas m ON c.manga_id = m.id
        GROUP BY m.id
        ORDER BY revenue DESC
    ");
    $mangaStats = $mangaStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'stats' => [
        'total_revenue' => $stats['total_revenue'],
        'total_chapters_sold' => $stats['total_chapters_sold'],
        'manga_stats' => $mangaStats
    ]]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Database error']);
}
