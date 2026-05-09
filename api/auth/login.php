<?php
require_once __DIR__ . '/../security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 405 Method Not Allowed');
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'نام کاربری و رمز عبور الزامی است.']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, username, password_hash, role, wallet_balance FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
    // Generate new session ID to prevent Session Fixation attacks
    session_regenerate_id(true);

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['user_role'] = $user['role'];

    // Update stamps for hijakcing check
    $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN_IP';
    $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN_UA';

    echo json_encode([
        'message' => 'ورود موفقیت‌آمیز بود.',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'wallet_balance' => $user['wallet_balance']
        ]
    ]);
} else {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['error' => 'نام کاربری یا رمز عبور اشتباه است.']);
}
