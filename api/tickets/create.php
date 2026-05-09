<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') exit;
$data = json_decode(file_get_contents('php://input'), true);

$subject = sanitizeInput($data['subject'] ?? '');
$message = sanitizeInput($data['message'] ?? '');

if (!$subject || !$message) {
    echo json_encode(['error' => 'All fields required']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("INSERT INTO tickets (user_id, subject) VALUES (?, ?)");
    $stmt->execute([$_SESSION['user_id'], $subject]);
    $ticketId = $pdo->lastInsertId();

    $stmt2 = $pdo->prepare("INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES (?, ?, ?)");
    $stmt2->execute([$ticketId, $_SESSION['user_id'], $message]);

    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['error' => 'Database error']);
}
