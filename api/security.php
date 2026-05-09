<?php
require_once __DIR__ . '/config.php';

// Secure Session Initialization
if (session_status() === PHP_SESSION_NONE) {
    // Force sessions to only use cookies (no URL parameters)
    ini_set('session.use_only_cookies', 1);
    ini_set('session.use_strict_mode', 1);
    // Prevent client-side JS from accessing the session cookie (fixes XSS to Hijacking)
    ini_set('session.cookie_httponly', 1);
    
    // Uncomment the next line if the site runs on HTTPS entirely
    // ini_set('session.cookie_secure', 1); 
    
    session_start();
}

$current_ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN_IP';
$current_ua = $_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN_UA';

// ----------------------------------------------------------------------------
// 1. Session Hijacking Prevention (IP and User-Agent validation)
// ----------------------------------------------------------------------------
if (isset($_SESSION['user_id'])) {
    if (!isset($_SESSION['ip_address']) || !isset($_SESSION['user_agent'])) {
        // Initializing security stamps on login/creation
        $_SESSION['ip_address'] = $current_ip;
        $_SESSION['user_agent'] = $current_ua;
    } else {
        // Validate stamps against current request
        if ($_SESSION['ip_address'] !== $current_ip || $_SESSION['user_agent'] !== $current_ua) {
            // Possible session hijack! IP or Browser changed suddenly.
            session_unset();
            session_destroy();
            header('HTTP/1.1 403 Forbidden');
            echo json_encode(['error' => 'Invalid session context. Please login again.']);
            exit;
        }
    }
    
    // Regenerate session ID periodically to prevent session fixation attacks
    if (!isset($_SESSION['last_regeneration'])) {
        $_SESSION['last_regeneration'] = time();
    } elseif (time() - $_SESSION['last_regeneration'] > 1800) { // regenerate every 30 mins
        session_regenerate_id(true);
        $_SESSION['last_regeneration'] = time();
    }
}

// ----------------------------------------------------------------------------
// 2. Rate Limiting (60 requests per 60 seconds)
// ----------------------------------------------------------------------------
function enforceRateLimit() {
    global $current_ip;
    $timeWindow = 60; // 60 seconds
    $maxRequests = 60; // Max 60 requests per IP
    
    if (!isset($_SESSION['rate_limit'])) {
        $_SESSION['rate_limit'] = [
            'requests' => 1,
            'start_time' => time()
        ];
        return;
    }
    
    $elapsed = time() - $_SESSION['rate_limit']['start_time'];
    
    if ($elapsed < $timeWindow) {
        $_SESSION['rate_limit']['requests']++;
        if ($_SESSION['rate_limit']['requests'] > $maxRequests) {
            error_log("Rate limit exceeded for IP: $current_ip");
            header('HTTP/1.1 429 Too Many Requests');
            header('Retry-After: ' . ($timeWindow - $elapsed));
            echo json_encode(['error' => 'Rate limit exceeded. Please try again later.']);
            exit;
        }
    } else {
        // Reset window after 60 seconds have passed
        $_SESSION['rate_limit'] = [
            'requests' => 1,
            'start_time' => time()
        ];
    }
}

enforceRateLimit();

// ----------------------------------------------------------------------------
// 3. Security Headers and Utility Functions
// ----------------------------------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY'); // Prevent clickjacking
header('X-XSS-Protection: 1; mode=block');

/**
 * Clean strings to prevent XSS. 
 * Use this ONLY for rendering HTML in PHP if ever needed.
 * Note: Since our backend is mostly an API returning JSON, 
 * Vue/React/Vanilla JS `textContent` naturally escapes JSON values, 
 * but it's crucial if you send HTML directly.
 */
function sanitizeOutput($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

/**
 * Require User Authentication Helper
 */
function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(['error' => 'Unauthorized access. Please login.']);
        exit;
    }
}

/**
 * Require Admin Role Helper (Allows admin and super_admin)
 */
function requireAdmin() {
    requireAuth();
    if ($_SESSION['user_role'] !== 'admin' && $_SESSION['user_role'] !== 'super_admin') {
        header('HTTP/1.1 403 Forbidden');
        echo json_encode(['error' => 'Admin privileges required.']);
        exit;
    }
}

/**
 * Require Super Admin Role Helper
 */
function requireSuperAdmin() {
    requireAuth();
    if ($_SESSION['user_role'] !== 'super_admin') {
        header('HTTP/1.1 403 Forbidden');
        echo json_encode(['error' => 'Super Admin privileges required.']);
        exit;
    }
}
