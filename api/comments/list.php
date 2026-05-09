<?php
require_once __DIR__ . '/../security.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mangaId = intval($_GET['manga_id'] ?? 0);
    if (!$mangaId) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['success' => false, 'error' => 'شناسه مانهوا نامعتبر']);
        exit;
    }
    
    // Fetch comments (approved only)
    $stmt = $pdo->prepare("SELECT c.id, c.content, c.created_at, u.username, u.role FROM comments c JOIN users u ON c.user_id = u.id WHERE c.manga_id = ? AND c.status = 'approved' ORDER BY c.created_at DESC");
    $stmt->execute([$mangaId]);
    $comments = $stmt->fetchAll();
    
    // Sanitize string content
    foreach ($comments as &$c) {
        $c['content'] = htmlspecialchars($c['content'], ENT_QUOTES, 'UTF-8');
        $c['username'] = htmlspecialchars($c['username'], ENT_QUOTES, 'UTF-8');
    }
    
    echo json_encode(['success' => true, 'comments' => $comments]);
    exit;
}

header('HTTP/1.1 405 Method Not Allowed');
