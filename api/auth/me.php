<?php
require_once __DIR__ . '/../security.php';
requireAuth(); // Ensures the user is logged in, else exits with 401

// Fetch the absolute newest profile/wallet data directly from the DB
$stmt = $pdo->prepare("SELECT id, username, role, wallet_balance FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    session_destroy();
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['error' => 'User not found.']);
    exit;
}

echo json_encode([
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'wallet_balance' => $user['wallet_balance']
    ]
]);
