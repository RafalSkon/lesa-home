$path = 'C:\Users\p4cze\LeSa-CAD\app.js'
$content = Get-Content $path -Raw -Encoding UTF8

$search = @'
        if (selectedRoom && selectedRoom.id === room.id) {
            polyFill = room.isError ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 173, 181, 0.6)';
            room.polygon.bringToFront();
        }
        
        textContent = `${roomTitle}\n${room.areaM2.toFixed(1)} m2 | ${room.pipeSpacing}mm`;
        if (room.supplyLengthMeters > 0) {
            textContent += `\nDobieg: ${(room.supplyLengthMeters * 2).toFixed(1)}m`;
        }
        textContent += `\nPętle: ${room.loopCount} (~${averageLoopLength.toFixed(1)}m)`;
'@

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

$content = $content.Replace($search, $replace)

# Also fix the TRANZYT RUR
$searchTransit = @'
        if (selectedRoom && selectedRoom.id === room.id) {
            polyFill = 'rgba(245, 158, 11, 0.55)';
            room.polygon.bringToFront();
        }
        
        textContent = `${roomTitle}\n${room.areaM2.toFixed(1)} m2\n[TRANZYT RUR]`;
'@

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

$content = $content.Replace($searchTransit, $replaceTransit)

# Add event listener for dropdown
$searchEvent = @'
// ==========================================
// Inicjalizacja Aplikacji
// ==========================================
'@

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

$content = $content.Replace($searchEvent, $replaceEvent)

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
