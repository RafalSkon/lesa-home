<?php
/**
 * LeSa Home - Contracts & Protocols API
 */
require_once __DIR__ . '/db.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['type']) && $_GET['type'] === 'profile') {
            $stmt = $db->query("SELECT data_json FROM contracts WHERE id = 'CONTRACTOR_PROFILE'");
            $row = $stmt->fetch();
            $profile = $row ? json_decode($row['data_json'], true) : null;
            jsonResponse(['success' => true, 'profile' => $profile]);
        }

        $stmt = $db->query("SELECT * FROM contracts WHERE id != 'CONTRACTOR_PROFILE' ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $contracts = [];
        foreach ($rows as $row) {
            $parsed = json_decode($row['data_json'], true);
            if ($parsed) {
                $contracts[] = $parsed;
            }
        }
        jsonResponse(['success' => true, 'contracts' => $contracts]);
        break;

    case 'POST':
        $body = getJsonBody();
        
        // Handle saving contractor profile
        if (isset($body['isProfile']) && $body['isProfile']) {
            $json = json_encode($body['profile'], JSON_UNESCAPED_UNICODE);
            $stmt = $db->prepare("
                INSERT INTO contracts (id, number, date, client_id, data_json, created_at)
                VALUES ('CONTRACTOR_PROFILE', 'PROFILE', '', '', ?, ?)
                ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json
            ");
            $stmt->execute([$json, time() * 1000]);
            jsonResponse(['success' => true, 'profile' => $body['profile']]);
        }

        $id = !empty($body['id']) ? $body['id'] : 'CTR-' . time();
        $number = !empty($body['contractNumber']) ? trim($body['contractNumber']) : (!empty($body['number']) ? trim($body['number']) : 'UM/'.date('Y/m/d'));
        $date = !empty($body['date']) ? trim($body['date']) : date('Y-m-d');
        $clientId = !empty($body['clientId']) ? trim($body['clientId']) : '';
        $body['id'] = $id;
        $json = json_encode($body, JSON_UNESCAPED_UNICODE);
        $createdAt = time() * 1000;

        $stmt = $db->prepare("
            INSERT INTO contracts (id, number, date, client_id, data_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET 
                number = excluded.number,
                date = excluded.date,
                client_id = excluded.client_id,
                data_json = excluded.data_json
        ");
        $stmt->execute([$id, $number, $date, $clientId, $json, $createdAt]);

        jsonResponse(['success' => true, 'contract' => $body]);
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

        $stmt = $db->prepare("DELETE FROM contracts WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['success' => true, 'deleted' => $id]);
        break;

    default:
        jsonResponse(['success' => false, 'error' => 'Metoda niedozwolona'], 405);
}
