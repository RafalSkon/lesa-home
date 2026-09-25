$path = 'C:\Users\p4cze\LeSa-CAD\index.html'
$content = Get-Content $path -Raw -Encoding UTF8

$search = '(?s)<div class="panel-section">\s*<h2>Opcje Wy.*?</div>\s*<div class="panel-section">\s*<h2>2\. Kalib'

$replace = @'
<div class="panel-section">
                <h2>Opcje Wyświetlania</h2>
                <label for="labelFormatSelect" class="input-label">Ilość tekstu w pomieszczeniach:</label>
                <select id="labelFormatSelect">
                    <option value="full">Wszystkie parametry (pełny opis)</option>
                    <option value="medium">Tylko nazwa i powierzchnia</option>
                    <option value="simple">Tylko nazwa pomieszczenia</option>
                    <option value="none">Ukryj całkowicie tekst</option>
                </select>
            </div>

            <div class="panel-section">
                <h2>2. Kalib
'@

$content = [regex]::Replace($content, $search, $replace)
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
