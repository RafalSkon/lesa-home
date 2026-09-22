<?php
require_once 'db.php';
requireAdmin(); // Ensures the user is logged in and has an admin role

// ONLY 'Rafał' can access the audit logs
$currentUsername = $_SESSION['username'] ?? '';
$normalized = mb_strtolower($currentUsername, 'UTF-8');
if ($normalized !== 'rafał' && $normalized !== 'rafal') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Brak specjalnych uprawnień. Sekcja dostępna tylko dla Głównego Administratora.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500");
        $logs = $stmt->fetchAll();
        
        jsonResponse([
            'success' => true,
            'logs' => $logs
        ]);
    } catch (PDOException $e) {
        error_log('[Audit Fetch Error] ' . $e->getMessage());
        http_response_code(500);
        jsonResponse(['success' => false, 'error' => 'Błąd pobierania logów.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
}
