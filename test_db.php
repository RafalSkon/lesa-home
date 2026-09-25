<?php
require 'c:\LeSa.start\api\db.php';

// Simulate an upload
$projectId = 'PRJ-TEST123';
$fileUrl = 'uploads/test.s1c';

$updateStmt = $db->prepare("UPDATE projects SET cad_file = ? WHERE id = ?");
$res = $updateStmt->execute([$fileUrl, $projectId]);

echo "Update result: " . ($res ? 'true' : 'false') . "\n";

$stmt = $db->query('SELECT id, cad_file FROM projects');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
