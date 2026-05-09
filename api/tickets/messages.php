<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$ticketId = $_GET['ticket_id'] ?? 0;
// verify ownership
$stmt = $pdo->prepare("SELECT id FROM tickets WHERE id = ? AND user_id = ?");
$stmt->execute([$ticketId, $_SESSION['user_id']]);
if (!$stmt->fetch()) {
    echo json_encode(['error' => 'Unauthorized']); exit;
}

$stmt2 = $pdo->prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC");
$stmt2->execute([$ticketId]);
$messages = $stmt2->fetchAll();

foreach ($messages as &$m) {
    $m['is_mine'] = ($m['sender_id'] == $_SESSION['user_id']);
}

echo json_encode(['success' => true, 'messages' => $messages]);
