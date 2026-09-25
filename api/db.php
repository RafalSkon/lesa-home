<?php
/**
 * LeSa Home - Database & API Core (PHP + SQLite)
 * Auto-creates SQLite database and required tables on SeoHost NVMe storage.
 */

// Enable error reporting in development, but keep output clean for JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set CORS headers — restrict to known domains only
$allowedOrigins = [
    'https://lesa-home.pl',
    'https://www.lesa-home.pl',
    'http://localhost',
    'http://127.0.0.1'
];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Fallback for same-origin requests (no Origin header)
    header('Access-Control-Allow-Origin: https://lesa-home.pl');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Konfiguracja bezpiecznej sesji przed jej startem
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();

function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Brak dostępu (sesja wygasła lub brak autoryzacji).']);
        exit;
    }
}

// Database directory & path
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

// Protect data directory with an .htaccess if not already present
$htaccessPath = $dataDir . '/.htaccess';
if (!file_exists($htaccessPath)) {
    @file_put_contents($htaccessPath, "Order deny,allow\nDeny from all\n");
}

$dbPath = $dataDir . '/lesa.sqlite';

try {
    $db = new PDO("sqlite:" . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Initialize Schema
    $db->exec("
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            nip TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
            address TEXT DEFAULT '',
            city TEXT DEFAULT '',
            address_home TEXT DEFAULT '',
            address_company TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            title TEXT NOT NULL,
            address TEXT DEFAULT '',
            city TEXT DEFAULT '',
            address_home TEXT DEFAULT '',
            address_company TEXT DEFAULT '',
            status TEXT DEFAULT 'Nowy',
            cad_file TEXT DEFAULT '',
            cad_data TEXT DEFAULT '',
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS offers (
            id TEXT PRIMARY KEY,
            number TEXT NOT NULL,
            date TEXT NOT NULL,
            client_info TEXT DEFAULT '',
            total_net REAL DEFAULT 0,
            total_gross REAL DEFAULT 0,
            data_json TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS contracts (
            id TEXT PRIMARY KEY,
            number TEXT NOT NULL,
            date TEXT NOT NULL,
            client_id TEXT DEFAULT '',
            data_json TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS protocols (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            type TEXT NOT NULL,
            data_json TEXT NOT NULL,
            signature_data TEXT DEFAULT '',
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS project_files (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_url TEXT NOT NULL,
            file_size INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT DEFAULT '',
            entity_id TEXT DEFAULT '',
            details TEXT DEFAULT '',
            ip_address TEXT DEFAULT '',
            created_at INTEGER NOT NULL
        );
    ");

    
    // Migration: Add address_home and address_company to clients table if missing
    $columns = $db->query("PRAGMA table_info(clients)")->fetchAll(PDO::FETCH_ASSOC);
    $hasAddressHome = false;
    foreach ($columns as $col) {
        if ($col['name'] === 'address_home') {
            $hasAddressHome = true;
            break;
        }
    }
    if (!$hasAddressHome) {
        $db->exec("ALTER TABLE clients ADD COLUMN address_home TEXT DEFAULT ''");
        $db->exec("ALTER TABLE clients ADD COLUMN address_company TEXT DEFAULT ''");
    }

    // Migration: Add protocols to projects table if missing
    $projCols = $db->query("PRAGMA table_info(projects)")->fetchAll(PDO::FETCH_ASSOC);
    $hasProtocolsCol = false;
    foreach ($projCols as $col) {
        if ($col['name'] === 'protocols') {
            $hasProtocolsCol = true;
            break;
        }
    }
    if (!$hasProtocolsCol) {
        $db->exec("ALTER TABLE projects ADD COLUMN protocols TEXT DEFAULT ''");
    }

    // Migration: Add cad_data to projects table if missing
    $columns = $db->query("PRAGMA table_info(projects)")->fetchAll(PDO::FETCH_ASSOC);
    $hasCadData = false;
    $hasCadFile = false;
    foreach ($columns as $col) {
        if ($col['name'] === 'cad_data') {
            $hasCadData = true;
        }
        if ($col['name'] === 'cad_file') {
            $hasCadFile = true;
        }
    }
    if (!$hasCadData) {
        $db->exec("ALTER TABLE projects ADD COLUMN cad_data TEXT DEFAULT ''");
    }
    if (!$hasCadFile) {
        $db->exec("ALTER TABLE projects ADD COLUMN cad_file TEXT DEFAULT ''");
    }

    // Seed default admin user "Rafal" if not exists
    $adminUsername = 'Rafal';
    $checkAdminStmt = $db->prepare("SELECT id FROM users WHERE username = :username");
    $checkAdminStmt->execute([':username' => $adminUsername]);
    if (!$checkAdminStmt->fetch()) {
        $adminId = uniqid('usr_');
        $adminHash = password_hash('@!Winter@2026', PASSWORD_DEFAULT);
        $insertAdminStmt = $db->prepare("
            INSERT INTO users (id, username, password_hash, role, status, created_at)
            VALUES (:id, :username, :password_hash, 'admin', 'approved', :created_at)
        ");
        $insertAdminStmt->execute([
            ':id' => $adminId,
            ':username' => $adminUsername,
            ':password_hash' => $adminHash,
            ':created_at' => time()
        ]);
        
        // Also seed 'Rafał' just in case he types with a Polish letter
        $adminIdPl = uniqid('usr_');
        $insertAdminStmt->execute([
            ':id' => $adminIdPl,
            ':username' => 'Rafał',
            ':password_hash' => $adminHash,
            ':created_at' => time()
        ]);
    }

} catch (PDOException $e) {
    error_log('[LeSa DB ERROR] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Wystąpił wewnętrzny błąd serwera. Spróbuj ponownie.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Audit Log Helper
 */
function logAction($db, $action, $entityType = '', $entityId = '', $details = '') {
    try {
        $username = $_SESSION['username'] ?? 'Gość';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $stmt = $db->prepare("INSERT INTO audit_logs (username, action, entity_type, entity_id, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $username,
            $action,
            $entityType,
            $entityId,
            json_encode($details, JSON_UNESCAPED_UNICODE),
            $ip,
            time()
        ]);
    } catch (Exception $e) {
        // Silently fail logging so it doesn't break main flow
        error_log('[Audit Log Error] ' . $e->getMessage());
    }
}

function requireAdmin() {
    requireAuth();
    if (($_SESSION['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Brak uprawnień administratora.']);
        exit;
    }
}

/**
 * Send JSON response helper
 */
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function sanitizeInput($data) {
    if (is_array($data)) {
        foreach ($data as $key => $val) {
            $data[$key] = sanitizeInput($val);
        }
        return $data;
    }
    if (is_string($data)) {
        return htmlspecialchars(strip_tags($data), ENT_QUOTES, 'UTF-8');
    }
    return $data;
}

/**
 * Get JSON body from POST/PUT request
 */
function getJsonBody() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) return [];
    
    // Sanitize CAD data — allow content field through but sanitize metadata
    if (isset($data['action']) && $data['action'] === 'save_cad_data') {
        // Sanitize metadata fields, leave 'content' (CAD geometry) untouched but strip script tags
        if (isset($data['projectId'])) $data['projectId'] = htmlspecialchars(strip_tags($data['projectId']), ENT_QUOTES, 'UTF-8');
        if (isset($data['projectName'])) $data['projectName'] = htmlspecialchars(strip_tags($data['projectName']), ENT_QUOTES, 'UTF-8');
        if (isset($data['content'])) {
            // Remove any script/event handler injections from CAD content
            $data['content'] = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $data['content']);
            $data['content'] = preg_replace('/on\w+\s*=\s*["\'][^"\'>]*["\']/i', '', $data['content']);
        }
        return $data;
    }
    
    return sanitizeInput($data);
}

