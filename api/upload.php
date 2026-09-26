<?php
/**
 * LeSa Home - File Upload API
 * Handles upload of .s1c CAD files, compressed site photos, and PDF protocols to SeoHost NVMe storage.
 */
require_once __DIR__ . '/db.php';
requireAuth();

header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];

function normalizeFileRecord($row) {
    return [
        'id' => $row['id'],
        'projectId' => $row['project_id'],
        'project_id' => $row['project_id'],
        'fileType' => $row['file_type'],
        'file_type' => $row['file_type'],
        'fileName' => $row['file_name'],
        'file_name' => $row['file_name'],
        'fileUrl' => $row['file_url'],
        'file_url' => $row['file_url'],
        'fileSize' => (int)$row['file_size'],
        'file_size' => (int)$row['file_size'],
        'roomName' => isset($row['room_name']) ? $row['room_name'] : '',
        'room_name' => isset($row['room_name']) ? $row['room_name'] : '',
        'createdAt' => (int)$row['created_at'],
        'created_at' => (int)$row['created_at']
    ];
}

function sanitizeFileNamePart($str) {
    $trans = [
        'ą' => 'a', 'ć' => 'c', 'ę' => 'e', 'ł' => 'l', 'ń' => 'n', 'ó' => 'o', 'ś' => 's', 'ź' => 'z', 'ż' => 'z',
        'Ą' => 'A', 'Ć' => 'C', 'Ę' => 'E', 'Ł' => 'L', 'Ń' => 'N', 'Ó' => 'O', 'Ś' => 'S', 'Ź' => 'Z', 'Ż' => 'Z'
    ];
    $str = strtr($str, $trans);
    $str = preg_replace('/[^a-zA-Z0-9_-]+/', '_', trim($str));
    return trim($str, '_');
}

if ($method === 'GET') {
    $projectId = isset($_GET['projectId']) ? $_GET['projectId'] : null;
    if ($projectId) {
        $stmt = $db->prepare("SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC");
        $stmt->execute([$projectId]);
        $rows = $stmt->fetchAll();
    } else {
        $stmt = $db->query("SELECT * FROM project_files ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
    }
    $files = array_map('normalizeFileRecord', $rows);
    jsonResponse(['success' => true, 'files' => $files]);
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
$fileType = !empty($_POST['fileType']) ? $_POST['fileType'] : 'photo'; // photo, photo_room-0, photo_inne, cad, protocol
$roomName = !empty($_POST['roomName']) ? trim($_POST['roomName']) : '';

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

// Security: Verify actual MIME type
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $uploadedFile['tmp_name']);
    finfo_close($finfo);
    
    $allowedMimes = [
        'image/jpeg', 'image/png', 'image/webp', 
        'application/pdf', 'application/json', 
        'text/plain', 'application/octet-stream' // For .s1c custom files
    ];
    
    // We reject executable scripts explicitly, even if extension was spoofed
    if (strpos($mime, 'php') !== false || strpos($mime, 'html') !== false || !in_array($mime, $allowedMimes)) {
        jsonResponse(['success' => false, 'error' => 'Niedozwolony format zawartości pliku'], 400);
    }
}

// Check if this upload is a photo (monter site photo or admin upload)
$isPhoto = (strpos($fileType, 'photo') === 0 || in_array($ext, ['jpg', 'jpeg', 'png', 'webp']));

if ($isPhoto) {
    // Photos are saved in uploads/{projectId}/foto/
    $targetDir = $projectDir . '/foto';
    if (!is_dir($targetDir)) {
        @mkdir($targetDir, 0755, true);
    }

    // Try resolving room name if not sent explicitly in POST
    if (empty($roomName)) {
        if ($fileType === 'photo_inne') {
            $roomName = 'Inne / Ogólne';
        } elseif (strpos($fileType, 'photo_room-') === 0) {
            $roomIdx = (int)str_replace('photo_room-', '', $fileType);
            try {
                $pStmt = $db->prepare("SELECT cad_data FROM projects WHERE id = ?");
                $pStmt->execute([$projectId]);
                $pRow = $pStmt->fetch();
                if ($pRow && !empty($pRow['cad_data'])) {
                    $cad = json_decode($pRow['cad_data'], true);
                    if (!empty($cad['rooms'][$roomIdx]['name'])) {
                        $roomName = $cad['rooms'][$roomIdx]['name'];
                    }
                }
            } catch (Exception $e) {}
            if (empty($roomName)) {
                $roomName = 'Pomieszczenie ' . ($roomIdx + 1);
            }
        } else {
            $roomName = pathinfo($origName, PATHINFO_FILENAME);
        }
    }

    $cleanBaseName = sanitizeFileNamePart($roomName);
    if (empty($cleanBaseName)) {
        $cleanBaseName = 'Zdjecie';
    }

    // Naming: exactly the room name e.g. Kuchnia.jpg, Salon.jpg.
    // If a photo for this room already exists, increment index: Salon_2.jpg, Salon_3.jpg, etc.
    $newFileName = $cleanBaseName . '.' . $ext;
    if (file_exists($targetDir . '/' . $newFileName)) {
        $idx = 2;
        while (file_exists($targetDir . '/' . $cleanBaseName . '_' . $idx . '.' . $ext)) {
            $idx++;
        }
        $newFileName = $cleanBaseName . '_' . $idx . '.' . $ext;
    }

    $destPath = $targetDir . '/' . $newFileName;
    $fileUrl = 'uploads/' . $projectId . '/foto/' . $newFileName;
} else {
    // Other files (CAD, protocols, etc.) stay in uploads/{projectId}/
    $targetDir = $projectDir;
    $cleanBaseName = sanitizeFileNamePart(pathinfo($origName, PATHINFO_FILENAME));
    $newFileName = $fileType . '_' . $cleanBaseName . '_' . time() . '.' . $ext;
    $destPath = $targetDir . '/' . $newFileName;
    $fileUrl = 'uploads/' . $projectId . '/' . $newFileName;
}

if (!move_uploaded_file($uploadedFile['tmp_name'], $destPath)) {
    jsonResponse(['success' => false, 'error' => 'Błąd zapisu pliku na serwerze'], 500);
}

$fileId = 'FIL-' . substr(bin2hex(random_bytes(5)), 0, 9);
$fileSize = filesize($destPath);
$createdAt = time() * 1000;

$stmt = $db->prepare("
    INSERT INTO project_files (id, project_id, file_type, file_name, file_url, file_size, created_at, room_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([$fileId, $projectId, $fileType, $newFileName, $fileUrl, $fileSize, $createdAt, $roomName]);

if ($fileType === 'cad') {
    $updateStmt = $db->prepare("UPDATE projects SET cad_file = ? WHERE id = ?");
    $updateStmt->execute([$fileUrl, $projectId]);
}

jsonResponse([
    'success' => true,
    'message' => 'Zdjęcie zostało pomyślnie zapisane na serwerze!',
    'file' => [
        'id' => $fileId,
        'projectId' => $projectId,
        'project_id' => $projectId,
        'fileType' => $fileType,
        'file_type' => $fileType,
        'fileName' => $newFileName,
        'file_name' => $newFileName,
        'fileUrl' => $fileUrl,
        'file_url' => $fileUrl,
        'fileSize' => $fileSize,
        'file_size' => $fileSize,
        'roomName' => $roomName,
        'room_name' => $roomName,
        'createdAt' => $createdAt,
        'created_at' => $createdAt
    ]
]);
