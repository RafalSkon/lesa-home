$path = 'C:\Users\p4cze\LeSa-CAD\app.js'
$content = [System.IO.File]::ReadAllText($path)

$pattern = '(?s)function recalculateRoom\(room\) \{.*?room\.textObj = new fabric\.Text\(textContent, \{'

$replace = @'
function recalculateRoom(room) {
    if (pixelsPerMeter <= 0) return;
    
    room.heatingMode = room.heatingMode || 'heating';
    
    const areaPixels = calculatePolygonArea(room.points);
    room.areaM2 = areaPixels / (pixelsPerMeter * pixelsPerMeter);
    
    // Oblicz dystans magistrali w metrach (zasilanie + powrót = x2)
    room.supplyLengthMeters = (room.supplyLengthPixels || 0) / pixelsPerMeter;
    const supplyPipeLength = room.supplyLengthMeters * 2;
    
    let polyFill = 'rgba(0, 173, 181, 0.3)';
    let polyStroke = '#00ADB5';
    let strokeDashArray = null;
    let textContent = '';
    let textColor = '#0f172a';
    const center = getPolygonCenter(room.points);
    const roomTitle = room.name || `Pom. ${getRoomIndex(room.id)}`;
    
    const labelFormat = document.getElementById('labelFormatSelect') ? document.getElementById('labelFormatSelect').value : 'full';
    
    if (room.heatingMode === 'transit') {
        room.loopCount = 0;
        room.totalPipeLength = 0;
        room.isError = false;
        
        polyFill = 'rgba(245, 158, 11, 0.28)';
        polyStroke = '#f59e0b';
        strokeDashArray = [6, 4];
        
        if (selectedRoom && selectedRoom.id === room.id) {
            polyFill = 'rgba(245, 158, 11, 0.55)';
            room.polygon.bringToFront();
        }
        
        if (labelFormat === 'none') {
            textContent = '';
        } else if (labelFormat === 'simple') {
            textContent = roomTitle;
        } else if (labelFormat === 'medium') {
            textContent = `${roomTitle}\n${room.areaM2.toFixed(1)} m2`;
        } else {
            textContent = `${roomTitle}\n${room.areaM2.toFixed(1)} m2\n[TRANZYT RUR]`;
        }
        textColor = '#b45309';
        
        // Brak podziału na pętle
        if (room.loopGroup) {
            canvas.remove(room.loopGroup);
            room.loopGroup = null;
        }
    } else {
        // Standardowe ogrzewanie podłogowe
        const spacingMeters = room.pipeSpacing / 1000.0;
        const mbPerM2 = 1.0 / spacingMeters;
        const totalPipeLength = (room.areaM2 * mbPerM2) + supplyPipeLength;
        room.totalPipeLength = totalPipeLength;
        
        let calcLoopCount = Math.ceil(totalPipeLength / room.maxLoopLength);
        if (calcLoopCount < 1) calcLoopCount = 1;
        
        if (room.customLoopCount && room.customLoopCount > 0) {
            room.loopCount = room.customLoopCount;
        } else {
            room.loopCount = calcLoopCount;
        }
        
        const averageLoopLength = totalPipeLength / room.loopCount;
        room.isError = averageLoopLength > room.maxLoopLength;
        
        if (room.isError) {
            polyFill = 'rgba(239, 68, 68, 0.35)';
            polyStroke = '#ef4444';
        }
        if (selectedRoom && selectedRoom.id === room.id) {
            polyFill = room.isError ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 173, 181, 0.6)';
            room.polygon.bringToFront();
        }
        
        if (labelFormat === 'none') {
            textContent = '';
        } else if (labelFormat === 'simple') {
            textContent = roomTitle;
        } else if (labelFormat === 'medium') {
            textContent = `${roomTitle}\n${room.areaM2.toFixed(1)} m2`;
        } else {
            textContent = `${roomTitle}\n${room.areaM2.toFixed(1)} m2 | ${room.pipeSpacing}mm`;
            if (room.supplyLengthMeters > 0) {
                textContent += `\nDobieg: ${(room.supplyLengthMeters * 2).toFixed(1)}m`;
            }
            textContent += `\nPętle: ${room.loopCount} (~${averageLoopLength.toFixed(1)}m)`;
        }
        textColor = room.isError ? '#dc2626' : '#0f172a';
        
        // Wizualizacja podziału pętli
        if (room.loopGroup) canvas.remove(room.loopGroup);
        if (room.loopCount > 1 && !room.isError) {
            room.loopGroup = new fabric.Group([], { selectable: false, evented: false });
            
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            room.points.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            });
            
            const width = maxX - minX;
            const sliceWidth = width / room.loopCount;
            
            for (let i = 1; i < room.loopCount; i++) {
                const x = minX + sliceWidth * i;
                const line = new fabric.Line([x, minY, x, maxY], {
                    stroke: 'rgba(0, 173, 181, 0.4)',
                    strokeWidth: 2 / canvas.getZoom(),
                    strokeDashArray: [10, 10]
                });
                room.loopGroup.addWithUpdate(line);
            }
            
            const clipPath = new fabric.Polygon(room.points, { absolutePositioned: true });
            room.loopGroup.clipPath = clipPath;
            canvas.add(room.loopGroup);
        }
    }
    
    room.polygon.set({ fill: polyFill, stroke: polyStroke, strokeDashArray: strokeDashArray });
    
    if (room.textObj) canvas.remove(room.textObj);
    
    room.textObj = new fabric.Text(textContent, {
'@

$content = [regex]::Replace($content, $pattern, $replace)
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
