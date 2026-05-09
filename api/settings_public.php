<?php
require_once __DIR__ . '/../config.php';

$stmt = $pdo->query("SELECT base_price, bulk_discount_percent, footer_text, rules_text, zarinpal_enabled FROM settings LIMIT 1");
$settings = $stmt->fetch();
if ($settings) {
    echo json_encode(['settings' => $settings]);
} else {
    echo json_encode(['settings' => null]);
}
