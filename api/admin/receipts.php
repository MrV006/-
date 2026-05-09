<?php
require_once __DIR__ . '/../security.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List pending receipts with user info
    $stmt = $pdo->query("SELECT receipts.id, receipts.image_path, receipts.amount, receipts.status, receipts.submitted_at, users.username FROM receipts JOIN users ON receipts.user_id = users.id WHERE receipts.status = 'pending' ORDER BY receipts.submitted_at ASC");
    $receipts = $stmt->fetchAll();
    echo json_encode(['receipts' => $receipts]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Action to approve or reject a receipt
    $data = json_decode(file_get_contents('php://input'), true);
    $receiptId = intval($data['receipt_id'] ?? 0);
    $action = $data['action'] ?? ''; // expects 'approve' or 'reject'
    
    if (!$receiptId || !in_array($action, ['approve', 'reject'])) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['error' => 'درخواست نامعتبر است.']);
        exit;
    }
    
    try {
        // Critical Section: Using PDO Transaction to guarantee atomic operations
        $pdo->beginTransaction();
        
        // Lock the requested receipt row for update to prevent double-spending/processing
        $stmt = $pdo->prepare("SELECT user_id, amount, status FROM receipts WHERE id = ? FOR UPDATE");
        $stmt->execute([$receiptId]);
        $receipt = $stmt->fetch();
        
        if (!$receipt || $receipt['status'] !== 'pending') {
            throw new Exception("فیش یافت نشد یا قبلاً بررسی شده است.");
        }
        
        $newStatus = ($action === 'approve') ? 'approved' : 'rejected';
        
        // 1. Update receipt status
        $updateStmt = $pdo->prepare("UPDATE receipts SET status = ? WHERE id = ?");
        $updateStmt->execute([$newStatus, $receiptId]);
        
        // 2. If approved, add money to the user's wallet
        if ($action === 'approve') {
            $walletStmt = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?");
            $walletStmt->execute([$receipt['amount'], $receipt['user_id']]);
        }
        
        $pdo->commit();
        echo json_encode(['message' => 'عملیات فیش (' . ($action === 'approve' ? 'تایید' : 'رد') . ') با موفقیت انجام شد.']);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    header('HTTP/1.1 405 Method Not Allowed');
}
