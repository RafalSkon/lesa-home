<?php
/**
 * LeSa Home - Projects API
 * Manages construction / installation projects, linked to clients and files.
 */
require_once __DIR__ . '/db.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT * FROM projects WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $project = $stmt->fetch();
            if ($project) {
                // Attach project files
                $filesStmt = $db->prepare("SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC");
                $filesStmt->execute([$project['id']]);
                $project['files'] = $filesStmt->fetchAll();
                
                $project['cadData'] = !empty($project['cad_data']) ? json_decode($project['cad_data'], true) : null;

                jsonResponse(['success' => true, 'project' => $project]);
            } else {
                jsonResponse(['success' => false, 'error' => 'Projekt nie znaleziony'], 404);
            }
        }

        // Fetch all projects with their files
        $stmt = $db->query("SELECT * FROM projects ORDER BY created_at DESC");
        $projects = $stmt->fetchAll();

        // Get all files indexed by project_id
        $filesStmt = $db->query("SELECT * FROM project_files ORDER BY created_at DESC");
        $allFiles = $filesStmt->fetchAll();
        $filesByProject = [];
        foreach ($allFiles as $file) {
            $pid = $file['project_id'];
            if (!isset($filesByProject[$pid])) {
                $filesByProject[$pid] = [];
            }
            $filesByProject[$pid][] = $file;
        }

        foreach ($projects as &$p) {
            $p['files'] = isset($filesByProject[$p['id']]) ? $filesByProject[$p['id']] : [];
            // Map keys for compatibility with admin.js / monter.js
            $p['clientId'] = $p['client_id'];
            $p['projectTitle'] = $p['title'];
            $p['investmentAddress'] = $p['address'];
            $p['investmentCity'] = $p['city'];
            $p['createdAt'] = intval($p['created_at']);
            $p['cadData'] = !empty($p['cad_data']) ? json_decode($p['cad_data'], true) : null;
        }

        jsonResponse(['success' => true, 'projects' => $projects]);
        break;

    case 'POST':
        $body = getJsonBody();
        if (empty($body['projectTitle']) && empty($body['title'])) {
            jsonResponse(['success' => false, 'error' => 'Tytuł projektu jest wymagany'], 400);
        }

        $id = !empty($body['id']) ? $body['id'] : 'PRJ-' . substr(bin2hex(random_bytes(5)), 0, 9);
        $clientId = !empty($body['clientId']) ? $body['clientId'] : (!empty($body['client_id']) ? $body['client_id'] : '');
        $title = !empty($body['projectTitle']) ? trim($body['projectTitle']) : trim($body['title']);
        $address = !empty($body['investmentAddress']) ? trim($body['investmentAddress']) : (isset($body['address']) ? trim($body['address']) : '');
        $city = !empty($body['investmentCity']) ? trim($body['investmentCity']) : (isset($body['city']) ? trim($body['city']) : '');
        $status = !empty($body['status']) ? trim($body['status']) : 'Nowy';
        $cadFile = !empty($body['cad_file']) ? trim($body['cad_file']) : '';
        $cadData = !empty($body['cadData']) ? json_encode($body['cadData'], JSON_UNESCAPED_UNICODE) : (!empty($body['cad_data']) ? $body['cad_data'] : '');
        $createdAt = !empty($body['createdAt']) ? intval($body['createdAt']) : (!empty($body['created_at']) ? intval($body['created_at']) : time() * 1000);

        $checkStmt = $db->prepare("SELECT id FROM projects WHERE id = ?");
        $checkStmt->execute([$id]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $stmt = $db->prepare("
                UPDATE projects SET 
                    client_id = ?, title = ?, address = ?, city = ?, status = ?, cad_file = ?, cad_data = ?
                WHERE id = ?
            ");
            $stmt->execute([$clientId, $title, $address, $city, $status, $cadFile, $cadData, $id]);
        } else {
            $stmt = $db->prepare("
                INSERT INTO projects (id, client_id, title, address, city, status, cad_file, cad_data, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$id, $clientId, $title, $address, $city, $status, $cadFile, $cadData, $createdAt]);
        }

        jsonResponse([
            'success' => true,
            'project' => [
                'id' => $id,
                'clientId' => $clientId,
                'client_id' => $clientId,
                'projectTitle' => $title,
                'title' => $title,
                'investmentAddress' => $address,
                'address' => $address,
                'investmentCity' => $city,
                'city' => $city,
                'status' => $status,
                'cad_file' => $cadFile,
                'cadData' => !empty($cadData) ? json_decode($cadData, true) : null,
                'createdAt' => $createdAt,
            ]
        ]);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) {
            $body = getJsonBody();
            $id = isset($body['id']) ? $body['id'] : null;
        }

        if (!$id) {
            jsonResponse(['success' => false, 'error' => 'Brak parametru id'], 400);
        }

        $stmt = $db->prepare("DELETE FROM projects WHERE id = ?");
        $stmt->execute([$id]);

        // Optionally delete associated files from DB
        $stmt = $db->prepare("DELETE FROM project_files WHERE project_id = ?");
        $stmt->execute([$id]);

        jsonResponse(['success' => true, 'deleted' => $id]);
        break;

    default:
        jsonResponse(['success' => false, 'error' => 'Metoda niedozwolona'], 405);
}
