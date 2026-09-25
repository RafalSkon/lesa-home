$path = 'C:\Users\p4cze\LeSa-CAD\app.js'
$content = [System.IO.File]::ReadAllText($path)
$pattern = '(?s)    saveProjectBtn\.addEventListener\(''click'', saveProjectS1C\);'
$replace = '    saveProjectBtn.addEventListener(''click'', saveProjectS1C);

    if (document.getElementById(''labelFormatSelect'')) {
        document.getElementById(''labelFormatSelect'').addEventListener(''change'', () => {
            recalculateAllRooms();
            canvas.renderAll();
        });
    }'
$content = [regex]::Replace($content, $pattern, $replace)
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
