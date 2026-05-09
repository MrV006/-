<?php
require_once __DIR__ . '/../security.php';

// Safe extraction of pagination
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = 12; // Items per page

// The Exact Pagination Formula requested: Offset = (Page - 1) * Limit
$offset = ($page - 1) * $limit;

// Total Count
$countStmt = $pdo->query("SELECT COUNT(id) FROM mangas");
$total = $countStmt->fetchColumn();

// Fetch paginated items securely
$stmt = $pdo->prepare("SELECT id, title, description, cover_image, created_at FROM mangas ORDER BY created_at DESC LIMIT :limit OFFSET :offset");

// Since emulate_prepares is false, PDO can securely bind integers to limit/offset!
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$mangas = $stmt->fetchAll();

echo json_encode([
    'mangas' => $mangas,
    'pagination' => [
        'current_page' => $page,
        'total_pages' => ceil($total / $limit),
        'total_items' => $total,
        'limit' => $limit,
        'formula_used' => "Offset = ($page - 1) * $limit"
    ]
]);
