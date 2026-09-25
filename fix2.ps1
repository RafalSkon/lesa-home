$path = 'C:\Users\p4cze\LeSa-CAD\index.html'
$content = [System.IO.File]::ReadAllText($path)
$pattern = '(?s)<h2>Opcje Wy.*?<\/select>'
$replace = '<h2>Opcje Wyświetlania</h2>
<label for="labelFormatSelect" class="input-label">Ilość tekstu w pomieszczeniach:</label>
<select id="labelFormatSelect">
<option value="full">Wszystkie parametry (pełny opis)</option>
<option value="medium">Tylko nazwa i powierzchnia</option>
<option value="simple">Tylko nazwa pomieszczenia</option>
<option value="none">Ukryj całkowicie tekst</option>
</select>'
$content = [regex]::Replace($content, $pattern, $replace)
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
