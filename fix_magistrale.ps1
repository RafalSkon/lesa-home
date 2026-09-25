$path = 'C:\Users\p4cze\LeSa-CAD\app.js'
$content = [System.IO.File]::ReadAllText($path)
$pattern = 'Rysuj Magistral.*?'';'
$replace = 'Rysuj Magistralę'';'
$content = [regex]::Replace($content, $pattern, $replace)
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
