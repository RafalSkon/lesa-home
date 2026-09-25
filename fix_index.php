<?php
$path = 'C:\Users\p4cze\LeSa-CAD\index.html';
$content = file_get_contents($path);

$content = preg_replace('/<h2>Opcje Wy.*?<\/select>/s', "<h2>Opcje Wyświetlania</h2>\n                <label for=\"labelFormatSelect\" class=\"input-label\">Ilość tekstu w pomieszczeniach:</label>\n                <select id=\"labelFormatSelect\">\n                    <option value=\"full\">Wszystkie parametry (pełny opis)</option>\n                    <option value=\"medium\">Tylko nazwa i powierzchnia</option>\n                    <option value=\"simple\">Tylko nazwa pomieszczenia</option>\n                    <option value=\"none\">Ukryj całkowicie tekst</option>\n                </select>", $content);

file_put_contents($path, $content);
echo "OK";
