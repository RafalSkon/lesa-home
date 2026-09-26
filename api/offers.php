<?php
/**
 * LeSa Home - Offers API
 * Manages commercial quotes & offers created in oferta.html
 */
require_once __DIR__ . '/db.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT * FROM offers WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $offer = $stmt->fetch();
            if ($offer) {
                $data = json_decode($offer['data_json'], true);
                if ($data) {
                    $data['totalNet'] = floatval($offer['total_net']);
                    $data['totalGross'] = floatval($offer['total_gross']);
                    $data['total_net'] = floatval($offer['total_net']);
                    $data['total_gross'] = floatval($offer['total_gross']);
                }
                jsonResponse(['success' => true, 'offer' => $data]);
            } else {
                jsonResponse(['success' => false, 'error' => 'Oferta nie znaleziona'], 404);
            }
        }

        $stmt = $db->query("SELECT * FROM offers ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $offers = [];
        foreach ($rows as $row) {
            $parsed = json_decode($row['data_json'], true);
            if ($parsed) {
                $parsed['totalNet'] = floatval($row['total_net']);
                $parsed['totalGross'] = floatval($row['total_gross']);
                $parsed['total_net'] = floatval($row['total_net']);
                $parsed['total_gross'] = floatval($row['total_gross']);
                $offers[] = $parsed;
            }
        }

        jsonResponse(['success' => true, 'offers' => $offers]);
        break;

    case 'POST':
        $body = getJsonBody();
        if (empty($body['number'])) {
            jsonResponse(['success' => false, 'error' => 'Numer oferty jest wymagany'], 400);
        }

        $id = !empty($body['id']) ? $body['id'] : 'OFE-' . time();
        $number = trim($body['number']);
        $date = !empty($body['date']) ? trim($body['date']) : date('Y-m-d');
        $clientInfo = !empty($body['clientInfo']) ? trim($body['clientInfo']) : '';
        
        // Calculate totals
        $net = 0;
        if (!empty($body['scopeItems']) && is_array($body['scopeItems'])) {
            foreach ($body['scopeItems'] as $item) {
                $qty = isset($item['qty']) ? floatval($item['qty']) : 0;
                $price = isset($item['price']) ? floatval($item['price']) : 0;
                $net += $qty * $price;
            }
        }
        $gross = $net * 1.08;

        $body['id'] = $id;
        $json = json_encode($body, JSON_UNESCAPED_UNICODE);
        $createdAt = time() * 1000;

        $checkStmt = $db->prepare("SELECT id FROM offers WHERE id = ? OR number = ?");
        $checkStmt->execute([$id, $number]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            $stmt = $db->prepare("
                UPDATE offers SET 
                    number = ?, date = ?, client_info = ?, total_net = ?, total_gross = ?, data_json = ?
                WHERE id = ?
            ");
            $stmt->execute([$number, $date, $clientInfo, $net, $gross, $json, $existing['id']]);
            $body['id'] = $existing['id'];
            logAction($db, 'Zaktualizowano ofertę', 'offer', $existing['id'], ['number' => $number, 'client' => $clientInfo]);
        } else {
            $stmt = $db->prepare("
                INSERT INTO offers (id, number, date, client_info, total_net, total_gross, data_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$id, $number, $date, $clientInfo, $net, $gross, $json, $createdAt]);
            logAction($db, 'Utworzono ofertę', 'offer', $id, ['number' => $number, 'client' => $clientInfo]);
        }

        jsonResponse(['success' => true, 'offer' => $body]);
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

        $stmt = $db->prepare("DELETE FROM offers WHERE id = ?");
        $stmt->execute([$id]);
        logAction($db, 'Usunięto ofertę', 'offer', $id);
        jsonResponse(['success' => true, 'deleted' => $id]);
        break;

    default:
        jsonResponse(['success' => false, 'error' => 'Metoda niedozwolona'], 405);
}
