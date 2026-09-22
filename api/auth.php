<?php
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

// Start session to hold login info if necessary, though we will just pass JSON back to localStorage
if ($action === 'register') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
    }

    $data = getJsonBody();
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    $preferredRole = $data['role'] ?? 'monter'; // 'admin' or 'monter'

    if (!$username || !$password) {
        jsonResponse(['success' => false, 'error' => 'Wymagane pole email i hasĹ‚o.'], 400);
    }

    // Check if user already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = :username");
    $stmt->execute([':username' => $username]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'error' => 'UĹĽytkownik o takim adresie email juĹĽ istnieje.'], 400);
    }

    $userId = uniqid('usr_');
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $status = 'pending'; // Requires approval

    $insertStmt = $db->prepare("
        INSERT INTO users (id, username, password_hash, role, status, created_at)
        VALUES (:id, :username, :password_hash, :role, :status, :created_at)
    ");

    try {
        $insertStmt->execute([
            ':id' => $userId,
            ':username' => $username,
            ':password_hash' => $hash,
            ':role' => $preferredRole,
            ':status' => $status,
            ':created_at' => time()
        ]);
        
        // Send email notification to admin
        $to = 'rafal@lesa-home.pl';
        $subject = 'Nowa rejestracja w systemie LeSa';
        $message = "Witaj,\n\nW systemie zarejestrowal sie nowy uzytkownik:\nEmail: $username\nPreferowana rola: $preferredRole\n\nZaloguj sie do panelu Administratora, przejdz do zakladki 'UĹĽytkownicy', aby zaakceptowac konto i przypisac odpowiednia role.\n\nPozdrawiamy,\nSystem LeSa";
        $headers = "From: system@lesa-home.pl\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        
        // Use @ to suppress errors in case the server mail configuration is missing locally
        @mail($to, $subject, $message, $headers);

        jsonResponse([
            'success' => true, 
            'message' => 'Zarejestrowano pomyĹ›lnie. Twoje konto oczekuje na akceptacjÄ™ administratora.'
        ]);
    } catch (PDOException $e) {
        error_log('[LeSa AUTH ERROR] ' . $e->getMessage());
        jsonResponse(['success' => false, 'error' => 'Wystąpił błąd serwera. Spróbuj ponownie.'], 500);
    }
}

if ($action === 'login') {
    // Rate limiting: max 5 login attempts per IP per 5 minutes
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rateLimitFile = __DIR__ . '/data/.rate_limit_' . md5($ip) . '.json';
    $maxAttempts = 5;
    $windowSeconds = 300; // 5 minutes
    
    if (file_exists($rateLimitFile)) {
        $rateData = json_decode(file_get_contents($rateLimitFile), true);
        if ($rateData && $rateData['count'] >= $maxAttempts && (time() - $rateData['first_attempt']) < $windowSeconds) {
            $remaining = $windowSeconds - (time() - $rateData['first_attempt']);
            jsonResponse(['success' => false, 'error' => "Zbyt wiele prób logowania. Spróbuj za " . ceil($remaining/60) . " min."], 429);
        }
        if ($rateData && (time() - $rateData['first_attempt']) >= $windowSeconds) {
            @unlink($rateLimitFile); // Reset window
        }
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
    }

    $data = getJsonBody();
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    $stmt = $db->prepare("SELECT id, username, password_hash, role, status FROM users WHERE username = :username");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        if ($user['status'] !== 'approved') {
            jsonResponse([
                'success' => false, 
                'error' => 'Twoje konto oczekuje na akceptacjÄ™ administratora.'
            ], 403);
        }
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['username'] = $user['username']; // Zapisuję również nazwę użytkownika w sesji
        
        // Zapisz zdarzenie w logu (nie używamy $_SESSION, bo dopiero ją ustawiliśmy, podajemy imię ręcznie w details)
        logAction($db, 'Logowanie do systemu', 'auth', $user['id'], ['username' => $user['username'], 'role' => $user['role']]);
        
        // Create simple session data to return
        $userData = [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ];
        
        // Zresetuj licznik błędnych logowań
        if (file_exists($rateLimitFile)) @unlink($rateLimitFile);
        
        jsonResponse(['success' => true, 'user' => $userData]);
    } else {
        // Increment failed login counter
        $rateData = file_exists($rateLimitFile) ? json_decode(file_get_contents($rateLimitFile), true) : null;
        if (!$rateData || (time() - ($rateData['first_attempt'] ?? 0)) >= $windowSeconds) {
            $rateData = ['count' => 1, 'first_attempt' => time()];
        } else {
            $rateData['count']++;
        }
        @file_put_contents($rateLimitFile, json_encode($rateData));

        jsonResponse(['success' => false, 'error' => 'NieprawidĹ‚owy login lub hasĹ‚o.'], 401);
    }
}

if ($action === 'check_session') {
    if (isset($_SESSION['user_id'])) {
        jsonResponse(['success' => true, 'role' => $_SESSION['role'] ?? '']);
    } else {
        jsonResponse(['success' => false, 'error' => 'Brak aktywnej sesji'], 401);
    }
}

if ($action === 'logout') {
    session_destroy();
    jsonResponse(['success' => true]);
}

if ($action === 'get_users') {
    requireAdmin();
    // Note: In production we should verify admin token here, but for now we rely on obscurity/local context
    $stmt = $db->query("SELECT id, username, role, status, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    jsonResponse(['success' => true, 'users' => $users]);
}

if ($action === 'update_user') {
    requireAdmin();
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
    }

    $data = getJsonBody();
    $id = $data['id'] ?? '';
    $role = $data['role'] ?? '';
    $status = $data['status'] ?? '';

    if (!$id) {
        jsonResponse(['success' => false, 'error' => 'Brak ID uĹĽytkownika'], 400);
    }

    // Jeśli podano nową rolę, aktualizuj i status i rolę. Inaczej sam status.
    if ($role) {
        $stmt = $db->prepare("UPDATE users SET status = ?, role = ? WHERE id = ?");
        $stmt->execute([$status, $role, $id]);
    } else {
        $stmt = $db->prepare("UPDATE users SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
    }

    jsonResponse(['success' => true, 'message' => 'Zaktualizowano profil uĹĽytkownika.']);
}

if ($action === 'reset_request') {
    $data = getJsonBody();
    $username = trim($data['username'] ?? '');
    if (!$username) jsonResponse(['success' => false, 'error' => 'Brak nazwy uzytkownika'], 400);

    $stmt = $db->prepare("UPDATE users SET status = 'reset_requested' WHERE username = :username");
    $stmt->execute([':username' => $username]);
    
    // Send email to admin
    $to = 'rafal@lesa-home.pl';
    $subject = 'Prosba o reset hasla w systemie LeSa';
    $message = "Witaj,\n\nUzytkownik '$username' prosi o zresetowanie hasla.\nZaloguj sie do panelu, przejdz do Uzytkownikow i nadaj mu nowe haslo.\n\nPozdrawiamy,\nSystem LeSa";
    $headers = "From: system@lesa-home.pl\r\n";
    @mail($to, $subject, $message, $headers);

    jsonResponse(['success' => true, 'message' => 'Prośba o reset hasła została wysłana do Administratora.']);
}

if ($action === 'admin_reset_password') {
    requireAdmin();
    $data = getJsonBody();
    $id = $data['id'] ?? '';
    $newPassword = $data['newPassword'] ?? '';
    if (!$id || !$newPassword) jsonResponse(['success' => false, 'error' => 'Brak ID lub hasła'], 400);

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE users SET password_hash = :hash, status = 'approved' WHERE id = :id");
    $stmt->execute([':hash' => $hash, ':id' => $id]);
    
    jsonResponse(['success' => true]);
}

jsonResponse(['success' => false, 'error' => 'Nieznana akcja'], 400);
