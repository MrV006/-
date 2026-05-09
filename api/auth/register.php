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

if (strlen($password) < 6) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'رمز عبور باید حداقل ۶ کاراکتر باشد.']);
    exit;
}

// Check if user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    header('HTTP/1.1 409 Conflict');
    echo json_encode(['error' => 'این نام کاربری قبلاً ثبت شده است.']);
    exit;
}

// First registered user becomes admin
$stmt = $pdo->query("SELECT COUNT(id) FROM users");
$userCount = $stmt->fetchColumn();
$role = ($userCount == 0) ? 'admin' : 'user';

// High security Argon2id hashing
$hashed_password = password_hash($password, PASSWORD_ARGON2ID);

$stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");
if ($stmt->execute([$username, $hashed_password, $role])) {
    echo json_encode(['message' => 'ثبت‌نام با موفقیت انجام شد.']);
} else {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'خطا در ثبت کاربر رخ داد.']);
}
