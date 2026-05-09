<?php
require_once __DIR__ . '/../security.php';

// Secure Session Destruction
session_unset();
session_destroy();

// Destroy the session cookie from the browser
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

echo json_encode(['message' => 'با موفقیت خارج شدید.']);
