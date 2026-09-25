<?php
/**
 * LeSa Home - File Upload API
 * Handles upload of .s1c CAD files, compressed site photos, and PDF protocols to SeoHost NVMe storage.
 */
require_once __DIR__ . '/db.php';
requireAuth();

header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $projectId = isset($_GET['projectId']) ? $_GET['projectId'] : null;
    if ($projectId) {
        $stmt = $db->prepare("SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC");
        $stmt->execute([$projectId]);
        $files = $stmt->fetchAll();
        jsonResponse(['success' => true, 'files' => $files]);
    } else {
        $stmt = $db->query("SELECT * FROM project_files ORDER BY created_at DESC");
        $files = $stmt->fetchAll();
        jsonResponse(['success' => true, 'files' => $files]);
    }
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if (!$id) {
        $body = getJsonBody();
        $id = isset($body['id']) ? $body['id'] : null;
    }
    if ($id) {
        $stmt = $db->prepare("SELECT * FROM project_files WHERE id = ?");
        $stmt->execute([$id]);
        $file = $stmt->fetch();
        if ($file && !empty($file['file_url'])) {
            $filePath = dirname(__DIR__) . '/' . $file['file_url'];
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }
        $delStmt = $db->prepare("DELETE FROM project_files WHERE id = ?");
        $delStmt->execute([$id]);
        jsonResponse(['success' => true, 'deleted' => $id]);
    } else {
        jsonResponse(['success' => false, 'error' => 'Brak parametru id'], 400);
    }
}

if ($method !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metoda niedozwolona'], 405);
}

// Target upload directory: uploads/
$baseUploadDir = dirname(__DIR__) . '/uploads';
if (!is_dir($baseUploadDir)) {
    @mkdir($baseUploadDir, 0755, true);
}

// 1. Check if raw JSON was sent (e.g. LeSa-CAD saving .s1c string directly)
$jsonBody = getJsonBody();
if (!empty($jsonBody['action']) && $jsonBody['action'] === 'save_cad_data') {
    $projectId = !empty($jsonBody['projectId']) ? $jsonBody['projectId'] : 'PRJ-GLOBAL';
    $projectName = !empty($jsonBody['projectName']) ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $jsonBody['projectName']) : 'projekt';
    $cadContent = !empty($jsonBody['content']) ? $jsonBody['content'] : '';

    if (empty($cadContent)) {
        jsonResponse(['success' => false, 'error' => 'Brak zawartości projektu CAD'], 400);
    }

    $projectDir = $baseUploadDir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $projectId);
    if (!is_dir($projectDir)) {
        @mkdir($projectDir, 0755, true);
    }

    $fileName = 'cad_' . $projectName . '_' . time() . '.s1c';
    $filePath = $projectDir . '/' . $fileName;

    if (file_put_contents($filePath, $cadContent) === false) {
        jsonResponse(['success' => false, 'error' => 'Nie udało się zapisać pliku CAD na serwerze'], 500);
    }

    $fileUrl = 'uploads/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $projectId) . '/' . $fileName;
    $fileId = 'FIL-' . substr(bin2hex(random_bytes(5)), 0, 9);
    $fileSize = strlen($cadContent);
    $createdAt = time() * 1000;

    // Save to DB
    $stmt = $db->prepare("
        INSERT INTO project_files (id, project_id, file_type, file_name, file_url, file_size, created_at)
        VALUES (?, ?, 'cad', ?, ?, ?, ?)
    ");
    $stmt->execute([$fileId, $projectId, $fileName, $fileUrl, $fileSize, $createdAt]);

    // Also update cad_file in projects table if project exists
    $updateStmt = $db->prepare("UPDATE projects SET cad_file = ? WHERE id = ?");
    $updateStmt->execute([$fileUrl, $projectId]);

    jsonResponse([
        'success' => true,
        'message' => 'Projekt LeSa-CAD został zapisany na serwerze!',
        'file' => [
            'id' => $fileId,
            'projectId' => $projectId,
            'fileName' => $fileName,
            'fileUrl' => $fileUrl,
            'fileSize' => $fileSize,
            'createdAt' => $createdAt
        ]
    ]);
}

// 2. Handle multipart/form-data (Photos, PDFs, S1C file upload)
if (empty($_FILES['file'])) {
    jsonResponse(['success' => false, 'error' => 'Brak przesłanego pliku w formularzu'], 400);
}

$uploadedFile = $_FILES['file'];
if ($uploadedFile['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['success' => false, 'error' => 'Błąd podczas transferu pliku: ' . $uploadedFile['error']], 400);
}

$projectId = !empty($_POST['projectId']) ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $_POST['projectId']) : 'PRJ-GLOBAL';
$fileType = !empty($_POST['fileType']) ? $_POST['fileType'] : 'photo'; // photo, cad, protocol

$projectDir = $baseUploadDir . '/' . $projectId;
if (!is_dir($projectDir)) {
    @mkdir($projectDir, 0755, true);
}

$origName = basename($uploadedFile['name']);
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

// Allowed extensions
$allowedExts = ['jpg', 'jpeg', 'png', 'webp', 's1c', 'json', 'pdf'];
if (!in_array($ext, $allowedExts)) {
    jsonResponse(['success' => false, 'error' => 'Niedozwolone rozszerzenie pliku: .' . $ext], 400);
}

$cleanBaseName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
$newFileName = $fileType . '_' . $cleanBaseName . '_' . time() . '.' . $ext;
$destPath = $projectDir . '/' . $newFileName;

if (!move_uploaded_file($uploadedFile['tmp_name'], $destPath)) {
    jsonResponse(['success' => false, 'error' => 'Błąd zapisu pliku w katalogu uploads'], 500);
}

$fileUrl = 'uploads/' . $projectId . '/' . $newFileName;
$fileId = 'FIL-' . substr(bin2hex(random_bytes(5)), 0, 9);
$fileSize = filesize($destPath);
$createdAt = time() * 1000;

$stmt = $db->prepare("
    INSERT INTO project_files (id, project_id, file_type, file_name, file_url, file_size, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([$fileId, $projectId, $fileType, $newFileName, $fileUrl, $fileSize, $createdAt]);

if ($fileType === 'cad') {
    $updateStmt = $db->prepare("UPDATE projects SET cad_file = ? WHERE id = ?");
    $updateStmt->execute([$fileUrl, $projectId]);
}

jsonResponse([
    'success' => true,
    'message' => 'Plik został pomyślnie wgrany na serwer!',
    'file' => [
        'id' => $fileId,
        'projectId' => $projectId,
        'fileType' => $fileType,
        'fileName' => $newFileName,
        'fileUrl' => $fileUrl,
        'fileSize' => $fileSize,
        'createdAt' => $createdAt
    ]
]);
