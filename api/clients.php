<?php
/**
 * LeSa Home - Clients API
 * Endpoints for CRM Contractors / Clients
 */
require_once __DIR__ . '/db.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Optional search or single client
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT * FROM clients WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $client = $stmt->fetch();
            if ($client) {
                jsonResponse(['success' => true, 'client' => $client]);
            } else {
                jsonResponse(['success' => false, 'error' => 'Klient nie znaleziony'], 404);
            }
        }

        $query = "SELECT * FROM clients ORDER BY created_at DESC";
        $stmt = $db->query($query);
        $clients = $stmt->fetchAll();
        jsonResponse(['success' => true, 'clients' => $clients]);
        break;

    case 'POST':
        $body = getJsonBody();
        if (empty($body['name'])) {
            jsonResponse(['success' => false, 'error' => 'Pole nazwa klienta jest wymagane'], 400);
        }

        $id = !empty($body['id']) ? $body['id'] : 'CLI-' . substr(bin2hex(random_bytes(5)), 0, 9);
        $name = trim($body['name']);
        $nip = isset($body['nip']) ? trim($body['nip']) : '';
        $phone = isset($body['phone']) ? trim($body['phone']) : '';
        $email = isset($body['email']) ? trim($body['email']) : '';
        $address = isset($body['address']) ? trim($body['address']) : '';
        $city = isset($body['city']) ? trim($body['city']) : '';
        $notes = isset($body['notes']) ? trim($body['notes']) : '';
        $createdAt = !empty($body['createdAt']) ? intval($body['createdAt']) : (!empty($body['created_at']) ? intval($body['created_at']) : time() * 1000);

        // Check if exists
        $checkStmt = $db->prepare("SELECT id FROM clients WHERE id = ?");
        $checkStmt->execute([$id]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $stmt = $db->prepare("
                UPDATE clients SET 
                    name = ?, nip = ?, phone = ?, email = ?, 
                    address = ?, city = ?, notes = ?
                WHERE id = ?
            ");
            $stmt->execute([$name, $nip, $phone, $email, $address, $city, $notes, $id]);
            logAction($db, 'Zaktualizowano klienta', 'client', $id, ['name' => $name, 'nip' => $nip]);
        } else {
            $stmt = $db->prepare("
                INSERT INTO clients (id, name, nip, phone, email, address, city, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$id, $name, $nip, $phone, $email, $address, $city, $notes, $createdAt]);
            logAction($db, 'Utworzono klienta', 'client', $id, ['name' => $name, 'nip' => $nip]);
        }

        jsonResponse([
            'success' => true,
            'client' => [
                'id' => $id,
                'name' => $name,
                'nip' => $nip,
                'phone' => $phone,
                'email' => $email,
                'address' => $address,
                'city' => $city,
                'notes' => $notes,
                'createdAt' => $createdAt
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

        $stmt = $db->prepare("DELETE FROM clients WHERE id = ?");
        $stmt->execute([$id]);
        logAction($db, 'Usunięto klienta', 'client', $id);
        jsonResponse(['success' => true, 'deleted' => $id]);
        break;

    default:
        jsonResponse(['success' => false, 'error' => 'Metoda niedozwolona'], 405);
}
