$path = 'C:\Users\p4cze\LeSa-CAD\app.js'
$content = Get-Content $path -Raw -Encoding UTF8

# Regex replacement for Standard mode
$pattern = '(?s)        if \(selectedRoom && selectedRoom\.id === room\.id\) \{.*?textContent \+= `\\nP.tle: \$\{room\.loopCount\} \(\~\$\{averageLoopLength\.toFixed\(1\)\}m\)`;'

$replace = @'
        if (selectedRoom && selectedRoom.id === room.id) {
            polyFill = room.isError ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 173, 181, 0.6)';
            room.polygon.bringToFront();
        }
        
        const labelFormat = document.getElementById('labelFormatSelect') ? document.getElementById('labelFormatSelect').value : 'full';
        
        if (labelFormat === 'none') {
            textContent = '';
        } else if (labelFormat === 'simple') {
            textContent = roomTitle;
        } else if (labelFormat === 'medium') {
            textContent = `${roomTitle}\n${room.areaM2.toFixed(1)} m2`;
        } else {
            // full
            textContent = `${roomTitle}\n${room.areaM2.toFixed(1)} m2 | ${room.pipeSpacing}mm`;
            if (room.supplyLengthMeters > 0) {
                textContent += `\nDobieg: ${(room.supplyLengthMeters * 2).toFixed(1)}m`;
            }
            textContent += `\nPętle: ${room.loopCount} (~${averageLoopLength.toFixed(1)}m)`;
        }
'@

$content = [regex]::Replace($content, $pattern, $replace)

# Regex replacement for Transit mode
$patternTransit = '(?s)        if \(selectedRoom && selectedRoom\.id === room\.id\) \{.*?textContent = `\$\{roomTitle\}\\n\$\{room\.areaM2\.toFixed\(1\)\} m2\\n\[TRANZYT RUR\]`;'

$replaceTransit = @'
        if (selectedRoom && selectedRoom.id === room.id) {
            polyFill = 'rgba(245, 158, 11, 0.55)';
            room.polygon.bringToFront();
        }
        
        const labelFormat = document.getElementById('labelFormatSelect') ? document.getElementById('labelFormatSelect').value : 'full';
        if (labelFormat === 'none') {
            textContent = '';
        } else if (labelFormat === 'simple') {
            textContent = roomTitle;
        } else if (labelFormat === 'medium') {
            textContent = `${roomTitle}\n${room.areaM2.toFixed(1)} m2`;
        } else {
            textContent = `${roomTitle}\n${room.areaM2.toFixed(1)} m2\n[TRANZYT RUR]`;
        }
'@

$content = [regex]::Replace($content, $patternTransit, $replaceTransit)

# Event listener
$patternEvent = '(?s)// ==========================================\s*// Inicjalizacja Aplikacji\s*// =========================================='

$replaceEvent = @'
// ==========================================
// Inicjalizacja Aplikacji
// ==========================================
if (document.getElementById('labelFormatSelect')) {
    document.getElementById('labelFormatSelect').addEventListener('change', () => {
        recalculateAllRooms();
    });
}
'@

$content = [regex]::Replace($content, $patternEvent, $replaceEvent)

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
