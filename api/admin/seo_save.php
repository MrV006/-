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

$data = json_decode(file_get_contents('php://input'), true);
$type = $data['type'] ?? '';
$title = $data['title'] ?? '';
$desc = $data['description'] ?? '';
$keywords = $data['keywords'] ?? '';

if ($type === 'site') {
    $stmt = $pdo->prepare("UPDATE settings SET seo_site_title = ?, seo_site_description = ?, seo_site_keywords = ?");
    $stmt->execute([$title, $desc, $keywords]);
    echo json_encode(['success' => true]);
} 
elseif ($type === 'manga') {
    $id = intval($data['id'] ?? 0);
    $stmt = $pdo->prepare("UPDATE mangas SET seo_title = ?, seo_description = ?, seo_keywords = ? WHERE id = ?");
    $stmt->execute([$title, $desc, $keywords, $id]);
    echo json_encode(['success' => true]);
}
elseif ($type === 'genre') {
    $genre = $data['genre'] ?? '';
    // upsert logic
    $stmt = $pdo->prepare("INSERT INTO genres_seo (genre, seo_title, seo_description, seo_keywords) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE seo_title=?, seo_description=?, seo_keywords=?");
    $stmt->execute([$genre, $title, $desc, $keywords, $title, $desc, $keywords]);
    echo json_encode(['success' => true]);
}
else {
    echo json_encode(['error' => 'Invalid type']);
}
