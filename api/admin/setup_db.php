<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/security.php';
requireAuth();

// Only admin allowed to trigger this (or super_admin)
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$u = $stmt->fetch();
if (!$u || !in_array($u['role'], ['admin', 'super_admin'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            subject VARCHAR(255) NOT NULL,
            status ENUM('open', 'answered', 'closed') DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS ticket_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id INT NOT NULL,
            sender_id INT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS staff_earnings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            chapter_id INT NOT NULL,
            role VARCHAR(50) NOT NULL,
            earned_amount DECIMAL(15, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS home_lists (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            query_type VARCHAR(50) NOT NULL,
            list_order INT DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS staff_uploads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            chapter_id INT NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT 0,
            is_popup BOOLEAN DEFAULT 0,
            link VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            manga_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
            UNIQUE KEY user_manga_unique (user_id, manga_id)
        );
    ");

    // Check columns in settings
    $cols = [
        "staff_chapter_reward INT DEFAULT 1",
        "footer_text TEXT NULL",
        "rules_text TEXT NULL",
        "zarinpal_enabled BOOLEAN DEFAULT 0",
        "zarinpal_merchant_id VARCHAR(255) NULL"
    ];
    foreach($cols as $coldef) {
        $parts = explode(' ', $coldef);
        $col = $parts[0];
        $check = $pdo->query("SHOW COLUMNS FROM settings LIKE '$col'");
        if ($check->rowCount() == 0) {
            $pdo->exec("ALTER TABLE settings ADD COLUMN $coldef");
        }
    }

    $check = $pdo->query("SHOW COLUMNS FROM comments LIKE 'is_pinned'");
    if ($check->rowCount() == 0) {
        $pdo->exec("ALTER TABLE comments ADD COLUMN is_pinned BOOLEAN DEFAULT 0");
    }

    // Check columns in mangas
    $check = $pdo->query("SHOW COLUMNS FROM mangas LIKE 'genres'");
    if ($check->rowCount() == 0) {
        $pdo->exec("ALTER TABLE mangas ADD COLUMN genres VARCHAR(255) NULL");
    }
    
    // Add SEO columns
    $checkSeo = $pdo->query("SHOW COLUMNS FROM mangas LIKE 'seo_title'");
    if ($checkSeo->rowCount() == 0) {
        $pdo->exec("ALTER TABLE mangas ADD COLUMN seo_title VARCHAR(255) NULL");
        $pdo->exec("ALTER TABLE mangas ADD COLUMN seo_description TEXT NULL");
        $pdo->exec("ALTER TABLE mangas ADD COLUMN seo_keywords TEXT NULL");
        
        $pdo->exec("ALTER TABLE settings ADD COLUMN seo_site_title VARCHAR(255) NULL");
        $pdo->exec("ALTER TABLE settings ADD COLUMN seo_site_description TEXT NULL");
        $pdo->exec("ALTER TABLE settings ADD COLUMN seo_site_keywords TEXT NULL");
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS genres_seo (
        genre VARCHAR(255) PRIMARY KEY,
        seo_title VARCHAR(255) NULL,
        seo_description TEXT NULL,
        seo_keywords TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $check = $pdo->query("SHOW COLUMNS FROM staff_uploads LIKE 'status'");
    if ($check->rowCount() == 0) {
        $pdo->exec("ALTER TABLE staff_uploads ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
        $pdo->exec("ALTER TABLE staff_uploads ADD COLUMN original_name VARCHAR(255) NULL");
    }

    echo json_encode(['success' => true, 'message' => "Tables and columns created successfully."]);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
