<?php
require_once __DIR__ . '/../security.php';
requireAuth();

// Fetching all purchased chapters of the logged-in user, joining the manga table to group them
$stmt = $pdo->prepare("
    SELECT m.id AS manga_id, m.title AS manga_title, m.cover_image, 
           c.id AS chapter_id, c.chapter_number, c.title AS chapter_title, p.purchased_at
    FROM purchases p
    JOIN chapters c ON p.chapter_id = c.id
    JOIN mangas m ON c.manga_id = m.id
    WHERE p.user_id = ?
    ORDER BY m.title ASC, c.chapter_number ASC
");
$stmt->execute([$_SESSION['user_id']]);
$purchases = $stmt->fetchAll();

// Group results by Manga ID for better UI representation
$library = [];
foreach ($purchases as $row) {
    $mId = $row['manga_id'];
    if (!isset($library[$mId])) {
        $library[$mId] = [
            'id' => $mId,
            'title' => $row['manga_title'],
            'cover_image' => $row['cover_image'],
            'chapters' => []
        ];
    }
    $library[$mId]['chapters'][] = [
        'id' => $row['chapter_id'],
        'number' => $row['chapter_number'],
        'title' => $row['chapter_title'],
        'purchased_at' => $row['purchased_at']
    ];
}

// Convert associative keys to flat array for exact JSON format
echo json_encode(['library' => array_values($library)]);
