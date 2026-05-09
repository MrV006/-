<?php
require_once __DIR__ . '/../security.php';
requireSuperAdmin(); // ONLY super admin can restore DB

// Increase limits for DB restore
ini_set('memory_limit', '512M');
ini_set('max_execution_time', '300');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['backup_file']) || $_FILES['backup_file']['error'] !== UPLOAD_ERR_OK) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['success' => false, 'error' => 'فایل بک‌آپ به درستی آپلود نشد.']);
        exit;
    }

    $file = $_FILES['backup_file'];
    
    // Simple validation
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    if (strtolower($ext) !== 'sql') {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['success' => false, 'error' => 'فقط فایل‌های SQL مجاز هستند.']);
        exit;
    }

    $sql = file_get_contents($file['tmp_name']);
    if (empty($sql)) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['success' => false, 'error' => 'فایل خالی است.']);
        exit;
    }

    try {
        // Temporarily disable foreign key checks
        $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
        
        // Execute the multi-query
        // Warning: This is inherently risky and expects a fully trusted .sql file (which it is, since super_admin uploads it)
        $pdo->exec($sql);
        
        $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
        
        echo json_encode(['success' => true, 'message' => 'پایگاه داده با موفقیت بازیابی شد.']);
    } catch(PDOException $e) {
        error_log("DB Restore Error: " . $e->getMessage());
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(['success' => false, 'error' => 'بازیابی با شکست مواجه شد. در مرورگر/کنسول سرور بررسی کنید.']);
    }
    
    exit;
}

header('HTTP/1.1 405 Method Not Allowed');
