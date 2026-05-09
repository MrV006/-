<?php
require_once __DIR__ . '/../security.php';
requireAuth();

$stmt = $pdo->prepare("SELECT id, amount, status, submitted_at FROM receipts WHERE user_id = ? ORDER BY submitted_at DESC");
$stmt->execute([$_SESSION['user_id']]);
$receipts = $stmt->fetchAll();

echo json_encode(['receipts' => $receipts]);
