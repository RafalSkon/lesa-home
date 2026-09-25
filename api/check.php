<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require 'db.php';

echo "<h2>Struktura tabeli projects:</h2>";
$columns = $db->query("PRAGMA table_info(projects)")->fetchAll(PDO::FETCH_ASSOC);
echo "<pre>";
print_r($columns);
echo "</pre>";

echo "<h2>Ostatnie 5 projektow z bazy:</h2>";
$projects = $db->query("SELECT id, title, cad_file FROM projects ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
echo "<pre>";
print_r($projects);
echo "</pre>";

echo "<h2>Ostatnie pliki z tabeli project_files:</h2>";
$files = $db->query("SELECT id, project_id, file_type, file_name, file_url FROM project_files ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
echo "<pre>";
print_r($files);
echo "</pre>";
