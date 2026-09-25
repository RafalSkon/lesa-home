$path = 'C:\Users\p4cze\LeSa-CAD\index.html'
$content = [System.IO.File]::ReadAllText($path)
$replace = [System.IO.File]::ReadAllText('c:\LeSa.start\replacement.html')
$pattern = '(?s)<h2>Opcje Wy.*?<\/select>'
$content = [regex]::Replace($content, $pattern, $replace)
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
