<?php
require_once __DIR__ . '/db.php';
requireAuth();

if (!isset($_GET['nip'])) {
    echo json_encode(['success' => false, 'error' => 'Brak numeru NIP']);
    exit;
}

$nip = preg_replace('/[^0-9]/', '', $_GET['nip']);
if (strlen($nip) !== 10) {
    echo json_encode(['success' => false, 'error' => 'Nieprawidłowy numer NIP (wymagane 10 cyfr)']);
    exit;
}

$date = date('Y-m-d');
$url = "https://wl-api.mf.gov.pl/api/search/nip/{$nip}?date={$date}";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200 && $response) {
    $data = json_decode($response, true);
    if (isset($data['result']['subject'])) {
        $subject = $data['result']['subject'];
        // Rozdzielanie adresu (zazwyczaj przychodzi jako jeden string np. "ul. Kwiatowa 1, 00-001 Warszawa")
        $fullAddress = $subject['workingAddress'] ?? $subject['residenceAddress'] ?? '';
        
        $city = '';
        $street = '';
        
        if ($fullAddress) {
            if (preg_match('/(.*?),\s*(\d{2}-\d{3}\s+.*)/', $fullAddress, $matches)) {
                $street = trim($matches[1]);
                $city = trim($matches[2]);
            } else {
                $street = $fullAddress;
            }
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'name' => $subject['name'] ?? '',
                'address' => $street,
                'city' => $city
            ]
        ]);
        exit;
    }
}

echo json_encode(['success' => false, 'error' => 'Nie znaleziono firmy na Białej Liście VAT.']);
