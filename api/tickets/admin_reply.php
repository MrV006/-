<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
if (!$user || !in_array($user['role'], ['admin', 'super_admin'])) exit;

$data = json_decode(file_get_contents('php://input'), true);
$ticketId = $data['ticket_id'] ?? 0;
$message = sanitizeInput($data['message'] ?? '');

$stmt2 = $pdo->prepare("INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES (?, ?, ?)");
$stmt2->execute([$ticketId, $_SESSION['user_id'], $message]);

$pdo->prepare("UPDATE tickets SET status = 'answered' WHERE id = ?")->execute([$ticketId]);

echo json_encode(['success' => true]);
