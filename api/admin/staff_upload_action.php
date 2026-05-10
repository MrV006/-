<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../security.php';
requireAuth();

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
if (!$user || !in_array($user['role'], ['admin', 'super_admin'])) {
    echo json_encode(['error' => 'Unauthorized']); exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$uploadId = intval($data['upload_id'] ?? 0);
$action = $data['action'] ?? '';

if (!$uploadId || !in_array($action, ['approve', 'reject'])) {
    echo json_encode(['error' => 'درخواست نامعتبر است']); exit;
}

$stmt = $pdo->prepare("SELECT id, user_id, chapter_id, role, file_path FROM staff_uploads WHERE id = ? AND status = 'pending'");
$stmt->execute([$uploadId]);
$upload = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$upload) {
    echo json_encode(['error' => 'فایل یافت نشد یا قبلاً بررسی شده است']); exit;
}

$newStatus = ($action === 'approve') ? 'approved' : 'rejected';

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare("UPDATE staff_uploads SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $uploadId]);

    if ($action === 'approve') {
        // give rewards to the user
        $setStmt = $pdo->query("SELECT staff_chapter_reward FROM settings LIMIT 1");
        $settings = $setStmt->fetch();
        $reward = $settings ? $settings['staff_chapter_reward'] : 1;
        
        $stmt = $pdo->prepare("INSERT INTO staff_earnings (user_id, chapter_id, role, earned_amount) VALUES (?, ?, ?, ?)");
        $stmt->execute([$upload['user_id'], $upload['chapter_id'], $upload['role'], 0]);
        
        // Unzip if it's a zip file (usually for cleaner/editor)
        if (strtolower(pathinfo($upload['file_path'], PATHINFO_EXTENSION)) === 'zip') {
            $zipPath = __DIR__ . '/../../' . $upload['file_path'];
            $extractPath = __DIR__ . '/../../uploads/chapters/chap_' . $upload['chapter_id'] . '/';
            if (!is_dir($extractPath)) {
                mkdir($extractPath, 0755, true);
            }
            if (class_exists('ZipArchive')) {
                $zip = new ZipArchive;
                if ($zip->open($zipPath) === TRUE) {
                    $zip->extractTo($extractPath);
                    $zip->close();
                }
            }
        }
        
        // Notify the user
        $msg = "فایل ارسالی شما برای چپتر ".$upload['chapter_id']." (نقش: ".$upload['role'].") تایید شد و پاداش دریافت کردید.";
        $notifyStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, is_popup) VALUES (?, ?, 0)");
        $notifyStmt->execute([$upload['user_id'], $msg]);
    } else {
        $msg = "فایل ارسالی شما برای چپتر ".$upload['chapter_id']." (نقش: ".$upload['role'].") توسط ادمین رد شد. لطفا فایل را اصلاح کنید.";
        $notifyStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, is_popup) VALUES (?, ?, 0)");
        $notifyStmt->execute([$upload['user_id'], $msg]);
    }
    
    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['error' => 'خطا در ثبت تغییرات']);
}
