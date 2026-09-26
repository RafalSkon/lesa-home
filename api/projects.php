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
                $project['protocols'] = !empty($project['protocols']) ? (is_array($project['protocols']) ? $project['protocols'] : json_decode($project['protocols'], true)) : null;
                $project['installationDate'] = $project['installation_date'] ?? '';
                $project['installation_date'] = $project['installation_date'] ?? '';
                $project['installationDays'] = intval($project['installation_days'] ?? 1);
                $project['installation_days'] = intval($project['installation_days'] ?? 1);
                $project['color'] = $project['color'] ?? '';
                $project['clientId'] = $project['client_id'];
                $project['projectTitle'] = $project['title'];
                $project['investmentAddress'] = $project['address'];
                $project['investmentCity'] = $project['city'];

                if (!empty($project['client_id'])) {
                    $cStmt = $db->prepare("SELECT * FROM clients WHERE id = ?");
                    $cStmt->execute([$project['client_id']]);
                    $c = $cStmt->fetch();
                    if ($c) {
                        $project['clientName'] = $c['name'];
                        $cAddr = $c['address'] ?: ($c['address_home'] ?: ($c['address_company'] ?: ''));
                        if (!empty($c['city']) && $cAddr && stripos($cAddr, $c['city']) === false) {
                            $cAddr .= ', ' . $c['city'];
                        } elseif (empty($cAddr) && !empty($c['city'])) {
                            $cAddr = $c['city'];
                        }
                        $project['clientAddress'] = $cAddr;
                        $project['clientCity'] = $c['city'] ?? '';
                        $project['clientNip'] = $c['nip'] ?? '';
                        $project['clientPhone'] = $c['phone'] ?? '';
                        $project['clientEmail'] = $c['email'] ?? '';
                    }
                }

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

        // Get all clients to map their names and addresses
        $clientsStmt = $db->query("SELECT * FROM clients");
        $allClients = $clientsStmt->fetchAll();
        $clientsById = [];
        foreach ($allClients as $client) {
            $clientsById[$client['id']] = $client;
        }

        foreach ($projects as &$p) {
            $p['files'] = isset($filesByProject[$p['id']]) ? $filesByProject[$p['id']] : [];
            // Map keys for compatibility with admin.js / monter.js / contract-generator.js
            $p['clientId'] = $p['client_id'];
            $p['projectTitle'] = $p['title'];
            $p['investmentAddress'] = $p['address'];
            $p['investmentCity'] = $p['city'];
            $p['createdAt'] = intval($p['created_at']);
            $p['cadData'] = !empty($p['cad_data']) ? json_decode($p['cad_data'], true) : null;
            $p['protocols'] = !empty($p['protocols']) ? (is_array($p['protocols']) ? $p['protocols'] : json_decode($p['protocols'], true)) : null;
            $p['installationDate'] = $p['installation_date'] ?? '';
            $p['installation_date'] = $p['installation_date'] ?? '';
            $p['installationDays'] = intval($p['installation_days'] ?? 1);
            $p['installation_days'] = intval($p['installation_days'] ?? 1);
            $p['color'] = $p['color'] ?? '';
            
            // Map client data
            if (isset($clientsById[$p['client_id']])) {
                $c = $clientsById[$p['client_id']];
                $p['clientName'] = $c['name'];
                $cAddr = $c['address'] ?: ($c['address_home'] ?: ($c['address_company'] ?: ''));
                if (!empty($c['city']) && $cAddr && stripos($cAddr, $c['city']) === false) {
                    $cAddr .= ', ' . $c['city'];
                } elseif (empty($cAddr) && !empty($c['city'])) {
                    $cAddr = $c['city'];
                }
                $p['clientAddress'] = $cAddr;
                $p['clientCity'] = $c['city'] ?? '';
                $p['clientNip'] = $c['nip'] ?? '';
                $p['clientPesel'] = $c['pesel'] ?? '';
                $p['clientIdCard'] = $c['id_card'] ?? '';
                $p['clientPhone'] = $c['phone'] ?? '';
                $p['clientEmail'] = $c['email'] ?? '';
            }
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
        $installationDate = isset($body['installationDate']) ? trim($body['installationDate']) : (isset($body['installation_date']) ? trim($body['installation_date']) : '');
        $installationDays = isset($body['installationDays']) ? intval($body['installationDays']) : (isset($body['installation_days']) ? intval($body['installation_days']) : 1);
        if ($installationDays < 1) $installationDays = 1;
        $color = !empty($body['color']) ? trim($body['color']) : ($exists ? ($exists['color'] ?? '') : '');

        $checkStmt = $db->prepare("SELECT * FROM projects WHERE id = ?");
        $checkStmt->execute([$id]);
        $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);

        $cadFile = !empty($body['cad_file']) ? trim($body['cad_file']) : ($exists ? $exists['cad_file'] : '');
        
        $cadDataInput = !empty($body['cadData']) ? json_encode($body['cadData'], JSON_UNESCAPED_UNICODE) : (!empty($body['cad_data']) ? $body['cad_data'] : '');
        $cadData = !empty($cadDataInput) ? $cadDataInput : ($exists ? $exists['cad_data'] : '');

        $protocolsInput = !empty($body['protocols']) ? (is_string($body['protocols']) ? $body['protocols'] : json_encode($body['protocols'], JSON_UNESCAPED_UNICODE)) : (!empty($body['protocols_data']) ? $body['protocols_data'] : '');
        $protocols = !empty($protocolsInput) ? $protocolsInput : ($exists ? ($exists['protocols'] ?? '') : '');
        
        $createdAt = !empty($body['createdAt']) ? intval($body['createdAt']) : (!empty($body['created_at']) ? intval($body['created_at']) : time() * 1000);

        if ($exists) {
            if ($installationDate === '' && isset($exists['installation_date']) && !isset($body['installationDate']) && !isset($body['installation_date'])) {
                $installationDate = $exists['installation_date'];
            }
            if (!isset($body['installationDays']) && !isset($body['installation_days']) && isset($exists['installation_days'])) {
                $installationDays = intval($exists['installation_days']);
            }
            $stmt = $db->prepare("
                UPDATE projects SET 
                    client_id = ?, title = ?, address = ?, city = ?, status = ?, cad_file = ?, cad_data = ?, protocols = ?, installation_date = ?, installation_days = ?, color = ?
                WHERE id = ?
            ");
            $stmt->execute([$clientId, $title, $address, $city, $status, $cadFile, $cadData, $protocols, $installationDate, $installationDays, $color, $id]);
        } else {
            $stmt = $db->prepare("
                INSERT INTO projects (id, client_id, title, address, city, status, cad_file, cad_data, protocols, installation_date, installation_days, color, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$id, $clientId, $title, $address, $city, $status, $cadFile, $cadData, $protocols, $installationDate, $installationDays, $color, $createdAt]);
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
                'installationDate' => $installationDate,
                'installation_date' => $installationDate,
                'installationDays' => $installationDays,
                'installation_days' => $installationDays,
                'color' => $color,
                'cad_file' => $cadFile,
                'cadData' => !empty($cadData) ? json_decode($cadData, true) : null,
                'protocols' => !empty($protocols) ? (is_array($protocols) ? $protocols : json_decode($protocols, true)) : null,
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
