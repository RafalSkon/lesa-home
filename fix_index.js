const fs = require('fs');
const path = 'C:\\Users\\p4cze\\LeSa-CAD\\index.html';
let content = fs.readFileSync(path, 'utf8');

// The messed up string
content = content.replace(/Opcje Wy.*?<\/select>/s, `Opcje Wyświetlania</h2>
                <label for="labelFormatSelect" class="input-label">Ilość tekstu w pomieszczeniach:</label>
                <select id="labelFormatSelect">
                    <option value="full">Wszystkie parametry (pełny opis)</option>
                    <option value="medium">Tylko nazwa i powierzchnia</option>
                    <option value="simple">Tylko nazwa pomieszczenia</option>
                    <option value="none">Ukryj całkowicie tekst</option>
                </select>`);

fs.writeFileSync(path, content, 'utf8');
