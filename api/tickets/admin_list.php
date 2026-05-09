<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
if (!$user || !in_array($user['role'], ['admin', 'super_admin'])) exit;

$stmt2 = $pdo->query("SELECT t.*, u.username FROM tickets t JOIN users u ON t.user_id = u.id ORDER BY t.status = 'open' DESC, t.created_at DESC");
echo json_encode(['success' => true, 'tickets' => $stmt2->fetchAll()]);
