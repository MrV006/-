<?php
require_once __DIR__ . '/../security.php';
requireSuperAdmin(); // ONLY super admin can edit wallets, usernames, roles

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List users
    $stmt = $pdo->query("SELECT id, username, role, wallet_balance, created_at FROM users ORDER BY id DESC");
    $users = $stmt->fetchAll();
    echo json_encode(['success' => true, 'users' => $users]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $userId = intval($data['id'] ?? 0);
    $username = $data['username'] ?? '';
    $role = $data['role'] ?? 'user';
    $wallet = floatval($data['wallet_balance'] ?? 0);
    
    // Basic validation
    if (!$userId || empty($username)) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['success' => false, 'error' => 'اطلاعات نامعتبر']);
        exit;
    }
    
    // Prevent super_admin from removing their own super_admin role directly to avoid locking out
    if ($userId === $_SESSION['user_id'] && $role !== 'super_admin') {
        header('HTTP/1.1 403 Forbidden');
        echo json_encode(['success' => false, 'error' => 'شما نمی‌توانید نقش خود را تغییر دهید.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE users SET username = ?, role = ?, wallet_balance = ? WHERE id = ?");
        $stmt->execute([$username, $role, $wallet, $userId]);
        echo json_encode(['success' => true, 'message' => 'کاربر با موفقیت بروزرسانی شد.']);
    } catch(PDOException $e) {
        if ($e->getCode() == 23000) {
            header('HTTP/1.1 409 Conflict');
            echo json_encode(['success' => false, 'error' => 'این نام کاربری قبلا استفاده شده است.']);
        } else {
            header('HTTP/1.1 500 Internal Server Error');
            echo json_encode(['success' => false, 'error' => 'خطای سرور']);
        }
    }
    exit;
}

header('HTTP/1.1 405 Method Not Allowed');
