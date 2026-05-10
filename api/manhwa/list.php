<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // Basic pagination
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
    $offset = ($page - 1) * $limit;
    $type = isset($_GET['type']) ? $_GET['type'] : 'latest';

    // Different sorting based on type
    $orderClause = "ORDER BY created_at DESC";
    if ($type === 'popular') {
        // Assuming there are views or rating, fallback to id for now if not exists
        // Just order by id ASC for demo differences if needed, or if views column exists
        $orderClause = "ORDER BY id ASC"; 
    } elseif ($type === 'recommended') {
        $orderClause = "ORDER BY RAND()"; // Random for recommendations 
    }

    $stmt = $pdo->prepare("SELECT id, title, description, cover_image, status, created_at FROM mangas $orderClause LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $mangas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Also get the total count for pagination info
    $countStmt = $pdo->query("SELECT COUNT(*) FROM mangas");
    $total = $countStmt->fetchColumn();

    // Sanitize output
    foreach ($mangas as &$manga) {
        $manga['title'] = htmlspecialchars($manga['title'], ENT_QUOTES, 'UTF-8');
        $manga['description'] = htmlspecialchars($manga['description'] ?? '', ENT_QUOTES, 'UTF-8');
        // If cover_image is empty, provide a default
        if (empty($manga['cover_image'])) {
            $manga['cover_image'] = '/assets/images/default-cover.jpg'; 
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $mangas,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => ceil($total / $limit),
            'total_items' => $total
        ]
    ]);

} catch (PDOException $e) {
    // Log error securely
    error_log("DB Error in list.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred.']);
}
?>
