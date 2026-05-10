<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');
$type = $_GET['type'] ?? '';

if ($type === 'site') {
    $stmt = $pdo->query("SELECT seo_site_title as title, seo_site_description as description, seo_site_keywords as keywords FROM settings LIMIT 1");
    $seo = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$seo) {
        $seo = ['title' => '', 'description' => '', 'keywords' => ''];
    }
    echo json_encode(['success' => true, 'seo' => $seo]);
} 
elseif ($type === 'manga') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT seo_title as title, seo_description as description, seo_keywords as keywords FROM mangas WHERE id = ?");
    $stmt->execute([$id]);
    $seo = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'seo' => $seo ?: ['title' => '', 'description' => '', 'keywords' => '']]);
}
elseif ($type === 'genre') {
    $genre = $_GET['genre'] ?? '';
    $stmt = $pdo->prepare("SELECT seo_title as title, seo_description as description, seo_keywords as keywords FROM genres_seo WHERE genre = ?");
    $stmt->execute([$genre]);
    $seo = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'seo' => $seo ?: ['title' => '', 'description' => '', 'keywords' => '']]);
}
elseif ($type === 'genres') {
    $stmt = $pdo->query("SELECT genre FROM genres_seo");
    $genres = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'genres' => $genres]);
}
else {
    echo json_encode(['error' => 'Invalid type']);
}
