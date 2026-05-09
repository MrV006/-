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

$pdo->prepare("UPDATE tickets SET status = 'closed' WHERE id = ?")->execute([$ticketId]);

echo json_encode(['success' => true]);
