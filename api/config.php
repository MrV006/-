<?php
// PHP Initialization and Error Handling (Production Ready)
// Hiding errors from user to prevent internal architecture disclosure
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');
error_reporting(E_ALL);

// Database Configurations
define('DB_HOST', 'localhost');
define('DB_NAME', 'mrvir111_mangata_db');
define('DB_USER', 'mrvir111_MrV');
define('DB_PASS', 'gB3(td@~iji9H2~d');
define('DB_CHARSET', 'utf8mb4');

// PDO Connection Setup
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Always return associative arrays
            PDO::ATTR_EMULATE_PREPARES   => false, // Extremely important to prevent SQL Injection
        ]
    );
} catch (\PDOException $e) {
    // Log error internally, do NOT output error message to the client
    error_log("DB Connection Failed: " . $e->getMessage());
    header('HTTP/1.1 500 Internal Server Error');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Database connection failed.']);
    exit;
}
