<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$data = json_decode(file_get_contents('php://input'), true);
$ticketId = $data['ticket_id'] ?? 0;
$message = sanitizeInput($data['message'] ?? '');

if (!$message) exit;

$stmt = $pdo->prepare("SELECT status FROM tickets WHERE id = ? AND user_id = ?");
$stmt->execute([$ticketId, $_SESSION['user_id']]);
$ticket = $stmt->fetch();
if (!$ticket || $ticket['status'] == 'closed') exit;

$stmt2 = $pdo->prepare("INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES (?, ?, ?)");
$stmt2->execute([$ticketId, $_SESSION['user_id'], $message]);

$pdo->prepare("UPDATE tickets SET status = 'open' WHERE id = ?")->execute([$ticketId]);

echo json_encode(['success' => true]);
