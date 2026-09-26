<?php
/**
 * LeSa Home - Contact Inquiry API
 * Securely handles inquiries from "Formularz szybkiego zapytania" on index.html.
 * - Destination email: oferty@lesa-home.pl
 * - Accepts blueprints (PDF), photos (JPG, PNG, WEBP), and CAD drawings (DWG)
 * - Multi-layer security: extension whitelist, double-extension block, content inspection,
 *   header/magic byte verification, script detection, randomized disk filenames, rate limiting & honeypot.
 */

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

// =========================================================================
// GET: Admin-only retrieval of inquiries
// =========================================================================
if ($method === 'GET') {
    requireAuth();
    
    if (isset($_GET['id'])) {
        $stmt = $db->prepare("SELECT * FROM inquiries WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        $inquiry = $stmt->fetch();
        if ($inquiry) {
            $inquiry['files'] = json_decode($inquiry['files_json'], true) ?: [];
            jsonResponse(['success' => true, 'inquiry' => $inquiry]);
        } else {
            jsonResponse(['success' => false, 'error' => 'Zapytanie nie zostało znalezione'], 404);
        }
    }

    $stmt = $db->query("SELECT * FROM inquiries ORDER BY created_at DESC");
    $rows = $stmt->fetchAll();
    $inquiries = array_map(function($row) {
        $row['files'] = json_decode($row['files_json'], true) ?: [];
        return $row;
    }, $rows);

    jsonResponse(['success' => true, 'inquiries' => $inquiries]);
}

// =========================================================================
// POST: Public submission of quick inquiry
// =========================================================================
if ($method !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metoda niedozwolona'], 405);
}

// 1. Anti-spam: Honeypot check
if (!empty($_POST['company_website'])) {
    // Silently succeed for bots
    jsonResponse([
        'success' => true,
        'message' => 'Dziękujemy! Twoje zapytanie zostało przesłane.'
    ]);
}

// 2. Anti-spam / Anti-flood: Rate limiting by IP (max 5 requests per 10 minutes)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitFile = __DIR__ . '/data/.rate_limit_contact_' . md5($ip) . '.json';
$maxAttempts = 5;
$windowSeconds = 600; // 10 minutes

if (file_exists($rateLimitFile)) {
    $rateData = json_decode(@file_get_contents($rateLimitFile), true);
    if ($rateData && ($rateData['count'] ?? 0) >= $maxAttempts && (time() - ($rateData['first_attempt'] ?? 0)) < $windowSeconds) {
        $remaining = $windowSeconds - (time() - $rateData['first_attempt']);
        jsonResponse([
            'success' => false,
            'error' => 'Zbyt wiele zapytań z Twojego adresu IP. Ze względów bezpieczeństwa prosimy odczekać ' . max(1, ceil($remaining / 60)) . ' min.'
        ], 429);
    }
    if ($rateData && (time() - ($rateData['first_attempt'] ?? 0)) >= $windowSeconds) {
        @unlink($rateLimitFile);
    }
}

// 3. Validate & sanitize text inputs
$name = trim(htmlspecialchars(strip_tags($_POST['name'] ?? ''), ENT_QUOTES, 'UTF-8'));
$phone = trim(htmlspecialchars(strip_tags($_POST['phone'] ?? ''), ENT_QUOTES, 'UTF-8'));
$email = trim(htmlspecialchars(strip_tags($_POST['email'] ?? ''), ENT_QUOTES, 'UTF-8'));
$area = !empty($_POST['area']) ? floatval($_POST['area']) : 0;
$location = trim(htmlspecialchars(strip_tags($_POST['location'] ?? ''), ENT_QUOTES, 'UTF-8'));
$stage = trim(htmlspecialchars(strip_tags($_POST['stage'] ?? ''), ENT_QUOTES, 'UTF-8'));
$message = trim(htmlspecialchars(strip_tags($_POST['message'] ?? ''), ENT_QUOTES, 'UTF-8'));

if (empty($name) || mb_strlen($name) < 2) {
    jsonResponse(['success' => false, 'error' => 'Proszę podać poprawne imię i nazwisko.'], 400);
}

if (empty($phone) || mb_strlen(preg_replace('/\D/', '', $phone)) < 6) {
    jsonResponse(['success' => false, 'error' => 'Proszę podać poprawny numer telefonu do kontaktu.'], 400);
}

if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'error' => 'Podany adres e-mail jest nieprawidłowy.'], 400);
}

// 4. Secure File Upload Handling
$inquiriesDir = dirname(__DIR__) . '/uploads/inquiries';
if (!is_dir($inquiriesDir)) {
    @mkdir($inquiriesDir, 0755, true);
}

// Ensure .htaccess blocking script execution is present in uploads/inquiries/
$htaccessPath = $inquiriesDir . '/.htaccess';
if (!file_exists($htaccessPath)) {
    $htaccessContent = "# LeSa Home - Security\n"
        . "Options -ExecCGI -Indexes\n"
        . "RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .phps .cgi .pl .py .sh\n"
        . "<FilesMatch \"\\.(php|phtml|php3|php4|php5|php7|phps|pl|py|cgi|asp|aspx|jsp|sh|bash|html|htm|shtml|svg|exe|cmd|bat|vbs|js|json)$\">\n"
        . "    Order deny,allow\n"
        . "    Deny from all\n"
        . "</FilesMatch>\n";
    @file_put_contents($htaccessPath, $htaccessContent);
}

// Normalize uploaded files array
$normalizedFiles = [];
if (!empty($_FILES['files']['name'])) {
    if (is_array($_FILES['files']['name'])) {
        for ($i = 0; $i < count($_FILES['files']['name']); $i++) {
            if (!empty($_FILES['files']['name'][$i])) {
                $normalizedFiles[] = [
                    'name' => $_FILES['files']['name'][$i],
                    'type' => $_FILES['files']['type'][$i] ?? '',
                    'tmp_name' => $_FILES['files']['tmp_name'][$i],
                    'error' => $_FILES['files']['error'][$i],
                    'size' => $_FILES['files']['size'][$i]
                ];
            }
        }
    } else {
        $normalizedFiles[] = $_FILES['files'];
    }
}

// Upload constraints
$maxFiles = 5;
$maxFileSize = 15 * 1024 * 1024; // 15 MB per file
$maxTotalSize = 35 * 1024 * 1024; // 35 MB total
$allowedExtensions = ['pdf', 'dwg', 'jpg', 'jpeg', 'png', 'webp'];

if (count($normalizedFiles) > $maxFiles) {
    jsonResponse(['success' => false, 'error' => "Możesz załączyć maksymalnie $maxFiles plików do jednego zapytania."], 400);
}

$totalSize = 0;
foreach ($normalizedFiles as $f) {
    $totalSize += (int)($f['size'] ?? 0);
}
if ($totalSize > $maxTotalSize) {
    jsonResponse(['success' => false, 'error' => 'Łączny rozmiar załączników przekracza dozwolony limit (max 35 MB).'], 400);
}

$savedFiles = [];

foreach ($normalizedFiles as $f) {
    if ($f['error'] !== UPLOAD_ERR_OK) {
        if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE) {
            jsonResponse(['success' => false, 'error' => 'Plik ' . htmlspecialchars($f['name']) . ' przekracza maksymalny rozmiar serwera.'], 400);
        }
        jsonResponse(['success' => false, 'error' => 'Błąd przesyłania pliku: ' . htmlspecialchars($f['name'])], 400);
    }

    if (!is_uploaded_file($f['tmp_name'])) {
        jsonResponse(['success' => false, 'error' => 'Nieprawidłowa próba przesłania pliku.'], 400);
    }

    if ($f['size'] > $maxFileSize) {
        jsonResponse(['success' => false, 'error' => 'Plik ' . htmlspecialchars($f['name']) . ' przekracza limit 15 MB.'], 400);
    }

    $origName = basename($f['name']);
    
    // Security check 1: Disallow null bytes
    if (strpos($origName, "\0") !== false || strpos($origName, "\\0") !== false) {
        jsonResponse(['success' => false, 'error' => 'Wykryto nieprawidłowe znaki w nazwie pliku.'], 400);
    }

    // Security check 2: Disallow disguised/double executable extensions
    if (preg_match('/\.(php|phtml|phar|cgi|pl|py|sh|bash|exe|bat|cmd|vbs|js|html|htm|svg|jar|msi|dll|scr|wsf)(\.|$)/i', $origName)) {
        jsonResponse(['success' => false, 'error' => 'Niedozwolony typ pliku lub podejrzana nazwa: ' . htmlspecialchars($origName)], 400);
    }

    // Security check 3: Whitelisted extension only
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExtensions)) {
        jsonResponse(['success' => false, 'error' => "Format .$ext jest niedozwolony. Akceptujemy wyłącznie: PDF, DWG, JPG, PNG, WEBP."], 400);
    }

    // Security check 4: Deep Content Inspection (reject embedded PHP tags, HTML scripts, or server-side execution tags)
    $sampleLen = min(1048576, (int)$f['size']); // check first 1 MB
    $sampleBytes = @file_get_contents($f['tmp_name'], false, null, 0, $sampleLen);
    if ($sampleBytes === false) {
        jsonResponse(['success' => false, 'error' => 'Nie można zweryfikować zawartości pliku ' . htmlspecialchars($origName)], 400);
    }

    if (preg_match('/<\?php|<\?=|<!--#exec|<script\b/i', $sampleBytes)) {
        jsonResponse(['success' => false, 'error' => 'Plik ' . htmlspecialchars($origName) . ' zawiera zabroniony kod skryptowy i został odrzucony.'], 400);
    }

    // Security check 5: Format-specific magic header verification
    if ($ext === 'pdf') {
        // Valid PDF must begin with %PDF-
        if (strncmp($sampleBytes, '%PDF-', 5) !== 0) {
            jsonResponse(['success' => false, 'error' => 'Plik ' . htmlspecialchars($origName) . ' nie jest poprawnym plikiem PDF.'], 400);
        }
    } elseif ($ext === 'dwg') {
        // Valid AutoCAD DWG must begin with "AC10" version marker (e.g. AC1015, AC1018, AC1021, AC1024, AC1027, AC1032)
        if (strncmp($sampleBytes, 'AC', 2) !== 0) {
            jsonResponse(['success' => false, 'error' => 'Plik ' . htmlspecialchars($origName) . ' nie jest poprawnym plikiem AutoCAD DWG.'], 400);
        }
    } elseif (in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
        // Validate image dimensions and header using getimagesize
        $imgInfo = @getimagesize($f['tmp_name']);
        if ($imgInfo === false) {
            jsonResponse(['success' => false, 'error' => 'Plik ' . htmlspecialchars($origName) . ' nie jest poprawnym obrazem graficznym.'], 400);
        }
    }

    // Security check 6: Secure randomized filename on disk (never retain user-supplied name as filesystem path)
    $storageFileName = 'inq_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $targetPath = $inquiriesDir . '/' . $storageFileName;

    if (!move_uploaded_file($f['tmp_name'], $targetPath)) {
        jsonResponse(['success' => false, 'error' => 'Nie udało się zapisać pliku na serwerze: ' . htmlspecialchars($origName)], 500);
    }

    // Set safe permissions
    @chmod($targetPath, 0644);

    $cleanOriginalName = preg_replace('/[^\p{L}\p{N}\-_.\(\) ]/u', '_', $origName);

    $savedFiles[] = [
        'originalName' => $cleanOriginalName,
        'storageName' => $storageFileName,
        'path' => $targetPath,
        'url' => 'uploads/inquiries/' . $storageFileName,
        'size' => (int)$f['size'],
        'ext' => $ext
    ];
}

// 5. Store inquiry in SQLite database
$inquiryId = 'INQ-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
$createdAt = time() * 1000;
$filesJson = json_encode($savedFiles, JSON_UNESCAPED_UNICODE);

try {
    $stmt = $db->prepare("
        INSERT INTO inquiries (id, name, phone, email, area, location, stage, message, files_json, ip_address, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Nowe', ?)
    ");
    $stmt->execute([
        $inquiryId,
        $name,
        $phone,
        $email,
        $area,
        $location,
        $stage,
        $message,
        $filesJson,
        $ip,
        $createdAt
    ]);

    logAction($db, 'Nowe zapytanie ofertowe z WWW', 'inquiry', $inquiryId, [
        'name' => $name,
        'phone' => $phone,
        'location' => $location,
        'files_count' => count($savedFiles)
    ]);
} catch (Exception $e) {
    error_log('[LeSa Inquiry DB Error] ' . $e->getMessage());
    // Continue so email is still attempted
}

// 6. Send Email to oferty@lesa-home.pl
$recipientEmail = 'oferty@lesa-home.pl';

// Human-friendly stage name mapping
$stageLabels = [
    'asap' => 'Jak najszybciej (najbliższy miesiąc)',
    '1-3-months' => 'Za 1-3 miesiące',
    'future' => 'W tym roku (stan surowy w trakcie)',
    'planning' => 'Dopiero planuję budowę'
];
$stageText = isset($stageLabels[$stage]) ? $stageLabels[$stage] : ($stage ?: 'Nie określono');

$subjectText = "[LeSa HOME] Nowe zapytanie o wycenę: " . $name . (!empty($location) ? " ($location)" : "");
$encodedSubject = "=?UTF-8?B?" . base64_encode($subjectText) . "?=";

$hostUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://') 
    . ($_SERVER['HTTP_HOST'] ?? 'lesa-home.pl');

// Build HTML attachments list
$attachmentsHtml = '';
if (!empty($savedFiles)) {
    $attachmentsHtml .= '<div style="margin-top:20px; padding:15px; background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">';
    $attachmentsHtml .= '<h4 style="margin:0 0 10px 0; color:#0f172a; font-size:14px; font-weight:bold;">Załączone pliki / rzuty / zdjęcia (' . count($savedFiles) . '):</h4>';
    $attachmentsHtml .= '<ul style="margin:0; padding-left:20px; font-size:13px; color:#334155; line-height:1.6;">';
    foreach ($savedFiles as $f) {
        $sizeKb = round($f['size'] / 1024, 1);
        $sizeMb = round($f['size'] / (1024 * 1024), 2);
        $sizeFormatted = $f['size'] > 1048576 ? "{$sizeMb} MB" : "{$sizeKb} KB";
        $fileDirectUrl = rtrim($hostUrl, '/') . '/' . ltrim($f['url'], '/');
        $extUpper = strtoupper($f['ext']);
        
        $attachmentsHtml .= '<li style="margin-bottom:6px;">';
        $attachmentsHtml .= '<strong>[' . htmlspecialchars($extUpper) . ']</strong> ' . htmlspecialchars($f['originalName']) . ' (' . $sizeFormatted . ') &bull; ';
        $attachmentsHtml .= '<a href="' . htmlspecialchars($fileDirectUrl) . '" target="_blank" style="color:#ea580c; text-decoration:underline; font-weight:bold;">Pobierz plik z serwera</a>';
        $attachmentsHtml .= '</li>';
    }
    $attachmentsHtml .= '</ul></div>';
} else {
    $attachmentsHtml .= '<p style="color:#64748b; font-size:13px; margin-top:15px; font-style:italic;">Brak załączonych plików.</p>';
}

$htmlMessage = '
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Nowe zapytanie ofertowe - LeSa HOME</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 25px 15px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background-color: #0f172a; padding: 24px 30px; text-align: left; border-bottom: 4px solid #ea580c;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">LeSa HOME • Nowe Zapytanie o Wycenę</h2>
        <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 12px;">Wysłano z Formularza szybkiego zapytania na stronie głównej</p>
      </td>
    </tr>
    <!-- Content Body -->
    <tr>
      <td style="padding: 30px;">
        <div style="margin-bottom: 22px;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #ffedd5; color: #c2410c; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
            ID: ' . htmlspecialchars($inquiryId) . '
          </span>
          <span style="font-size: 12px; color: #64748b; margin-left: 10px;">
            Data: ' . date('d.m.Y H:i') . '
          </span>
        </div>

        <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size: 13px; line-height: 1.5; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td width="35%" style="color: #64748b; font-weight: bold;">Imię i Nazwisko:</td>
            <td style="color: #0f172a; font-weight: bold; font-size: 15px;">' . htmlspecialchars($name) . '</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; font-weight: bold;">Telefon:</td>
            <td><a href="tel:' . preg_replace('/[^\d+]/', '', $phone) . '" style="color: #ea580c; font-weight: bold; text-decoration: none; font-size: 15px;">' . htmlspecialchars($phone) . '</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; font-weight: bold;">Adres E-mail:</td>
            <td>' . (!empty($email) ? '<a href="mailto:' . htmlspecialchars($email) . '" style="color: #ea580c; text-decoration: underline;">' . htmlspecialchars($email) . '</a>' : '<span style="color:#94a3b8; font-style:italic;">Nie podano</span>') . '</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; font-weight: bold;">Miejscowość inwestycji:</td>
            <td style="color: #0f172a; font-weight: bold;">' . (!empty($location) ? htmlspecialchars($location) : '<span style="color:#94a3b8; font-style:italic;">Nie podano</span>') . '</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; font-weight: bold;">Powierzchnia domu:</td>
            <td style="color: #0f172a; font-weight: bold;">' . ($area > 0 ? htmlspecialchars($area) . ' m²' : '<span style="color:#94a3b8; font-style:italic;">Nie podano</span>') . '</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; font-weight: bold;">Planowany termin prac:</td>
            <td style="color: #0f172a;">' . htmlspecialchars($stageText) . '</td>
          </tr>
        </table>

        <!-- Message -->
        <div style="margin-top: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 13px; font-weight: bold; text-transform: uppercase;">Uwagi / Treść zapytania:</h4>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-line;">'
            . (!empty($message) ? htmlspecialchars($message) : '<span style="color:#94a3b8; font-style:italic;">Brak dodatkowych uwag w formularzu.</span>') .
          '</div>
        </div>

        <!-- Attachments -->
        ' . $attachmentsHtml . '

      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 16px 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; text-align: center;">
        Wiadomość wygenerowana automatycznie przez system LeSa HOME • IP klienta: ' . htmlspecialchars($ip) . '
      </td>
    </tr>
  </table>
</body>
</html>';

// Build MIME multipart email
$boundary = "==_Multipart_Boundary_x" . md5(uniqid((string)time(), true)) . "x";

$headers = "From: Formularz LeSa HOME <system@lesa-home.pl>\r\n";
if (!empty($email)) {
    $headers .= "Reply-To: " . addcslashes($name, '"') . " <" . str_replace(["\r", "\n"], '', $email) . ">\r\n";
} else {
    $headers .= "Reply-To: oferty@lesa-home.pl\r\n";
}
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
$headers .= "X-Mailer: LeSa-HOME-System\r\n";

$emailBody = "--$boundary\r\n";
$emailBody .= "Content-Type: text/html; charset=UTF-8\r\n";
$emailBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$emailBody .= $htmlMessage . "\r\n\r\n";

// Attach files directly to the email if reasonable total size (<= 20 MB)
$attachToEmail = ($totalSize <= 20 * 1024 * 1024);
if ($attachToEmail) {
    $mimeMap = [
        'pdf' => 'application/pdf',
        'dwg' => 'application/octet-stream',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp'
    ];

    foreach ($savedFiles as $sf) {
        if (file_exists($sf['path'])) {
            $rawContent = @file_get_contents($sf['path']);
            if ($rawContent !== false) {
                $base64Data = chunk_split(base64_encode($rawContent));
                $fileMime = $mimeMap[$sf['ext']] ?? 'application/octet-stream';
                $safeAttName = str_replace(['"', "\r", "\n"], '', $sf['originalName']);

                $emailBody .= "--$boundary\r\n";
                $emailBody .= "Content-Type: $fileMime; name=\"$safeAttName\"\r\n";
                $emailBody .= "Content-Disposition: attachment; filename=\"$safeAttName\"\r\n";
                $emailBody .= "Content-Transfer-Encoding: base64\r\n\r\n";
                $emailBody .= $base64Data . "\r\n\r\n";
            }
        }
    }
}
$emailBody .= "--$boundary--";

// Send email using PHP mail()
$mailSent = @mail($recipientEmail, $encodedSubject, $emailBody, $headers);

// Update rate limiter
$rateData = file_exists($rateLimitFile) ? json_decode(@file_get_contents($rateLimitFile), true) : null;
if (!$rateData || (time() - ($rateData['first_attempt'] ?? 0)) >= $windowSeconds) {
    $rateData = ['count' => 1, 'first_attempt' => time()];
} else {
    $rateData['count']++;
}
@file_put_contents($rateLimitFile, json_encode($rateData));

jsonResponse([
    'success' => true,
    'message' => 'Dziękujemy, Twoje zapytanie zostało przesłane do naszego zespołu (oferty@lesa-home.pl). Skontaktujemy się z Tobą najszybciej jak to możliwe!',
    'inquiryId' => $inquiryId,
    'filesCount' => count($savedFiles),
    'mailSent' => $mailSent
]);
