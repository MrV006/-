<?php
require_once __DIR__ . '/../security.php';
requireAuth(); // Deny anonymous users

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 405 Method Not Allowed');
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$mangaId = intval($data['manga_id'] ?? 0);
$chaptersToBuy = $data['chapter_ids'] ?? [];

if (!$mangaId || empty($chaptersToBuy) || !is_array($chaptersToBuy)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'درخواست نامعتبر است. اطلاعات خرید دچار مشکل شده.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Lock user account balance for read/write integrity
    $stmtUser = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ? FOR UPDATE");
    $stmtUser->execute([$_SESSION['user_id']]);
    $user = $stmtUser->fetch();
    
    // 2. Fetch business logic settings
    $stmtSet = $pdo->query("SELECT base_price, bulk_discount_percent FROM settings ORDER BY id DESC LIMIT 1");
    $settings = $stmtSet->fetch();
    
    // 3. Server-side validation of requested items and prices! NEVER TRUST CLIENT.
    $placeholders = str_repeat('?,', count($chaptersToBuy) - 1) . '?';
    $stmtChaps = $pdo->prepare("SELECT id, price FROM chapters WHERE manga_id = ? AND id IN ($placeholders)");
    
    // Merge array to pass cleanly into PDO
    $params = array_merge([$mangaId], $chaptersToBuy);
    $stmtChaps->execute($params);
    $validChapters = $stmtChaps->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($validChapters)) {
        throw new Exception("فصل‌های درخواست شده یافت نشدند.");
    }
    
    // 4. Exclude Already Bought Chapters to prevent double billing
    $stmtPurchased = $pdo->prepare("SELECT chapter_id FROM purchases WHERE user_id = ? AND chapter_id IN ($placeholders)");
    
    $validChapterIds = array_column($validChapters, 'id');
    $purchasedParams = array_merge([$_SESSION['user_id']], $validChapterIds);
    $stmtPurchased->execute($purchasedParams);
    $alreadyBought = $stmtPurchased->fetchAll(PDO::FETCH_COLUMN);

    $totalPrice = 0;
    $chapterIdsToInsert = [];
    
    foreach ($validChapters as $c) {
        if (!in_array($c['id'], $alreadyBought)) {
            $effectivePrice = (floatval($c['price']) > 0) ? floatval($c['price']) : floatval($settings['base_price']);
            $totalPrice += $effectivePrice;
            $chapterIdsToInsert[] = $c['id'];
        }
    }
    
    if (empty($chapterIdsToInsert)) {
        throw new Exception("شما قبلاً تمام این فصل‌ها را خریداری کرده‌اید.");
    }
    
    // 5. Dynamic bulk discount calculation (if buying more than 1 new chapter)
    $actualDiscount = 0;
    if (count($chapterIdsToInsert) > 1 && floatval($settings['bulk_discount_percent']) > 0) {
        $actualDiscount = ($totalPrice * floatval($settings['bulk_discount_percent'])) / 100;
        $totalPrice -= $actualDiscount;
    }
    
    // Validate bounds constraint
    if ($user['wallet_balance'] < $totalPrice) {
        throw new Exception("موجودی کیف پول کافی نیست. هزینه نهایی تخفیف خورده برای خرید گروهی: " . Number_format($totalPrice) . " تومان");
    }
    
    // 6. Execution phase
    // Deduct exact calculated amount
    $stmtWal = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?");
    $stmtWal->execute([$totalPrice, $_SESSION['user_id']]);
    
    // Securely map and insert multiple rows into purchases table
    $insertQuery = "INSERT INTO purchases (user_id, chapter_id) VALUES (?, ?)";
    $stmtIn = $pdo->prepare($insertQuery);
    foreach ($chapterIdsToInsert as $cid) {
        $stmtIn->execute([$_SESSION['user_id'], $cid]);
    }

    $pdo->commit();
    echo json_encode([
        'message' => count($chapterIdsToInsert) . ' فصل با موفقیت خریداری و به کتابخانه اختصاصی شما در داشبورد افزوده شد.',
        'total_paid' => $totalPrice,
        'discount_applied' => $actualDiscount
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => $e->getMessage()]);
}
