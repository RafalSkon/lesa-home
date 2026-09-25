// ==========================================
// LeSa-CAD - Ogrzewanie Podłogowe
// Główny plik logiki aplikacji
// ==========================================

// Zmienne globalne
let canvas;
let currentImage = null;
let currentImageDataUrl = null;

function repairString(str) {
    if (!str || typeof str !== 'string') return str;
    return str.replace(/Ă„â€ÄąĹźĂ˘â‚¬śÄąÂ¤/g, '')
              .replace(/đź.ď¸Ź/g, '')
              .replace(/đź”Ą/g, '')
              .replace(/Ы.\?/g, '')
              .replace(/[^\x00-\x7FąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+ Rozdzielacz/g, 'Rozdzielacz').replace(/bezpo[^a-zA-Z0-9\s<]+redniego/g, 'bezpośredniego')
              .replace(/dost[^a-zA-Z0-9\s<]+pu/g, 'dostępu')
              .replace(/podk[^a-zA-Z0-9\s<]+ad/g, 'podkład')
              .replace(/podk[^a-zA-Z0-9\s<]+adu/g, 'podkładu')
              .replace(/Otw[^a-zA-Z0-9\s<]+rz/g, 'Otwórz')
              .replace(/p[^a-zA-Z0-9\s<]+tla/g, 'pętla')
              .replace(/p[^a-zA-Z0-9\s<]+tli/g, 'pętli')
              .replace(/P[^a-zA-Z0-9\s<]+tli/g, 'Pętli')
              .replace(/Podgl[^a-zA-Z0-9\s<]+d/g, 'Podgląd')
              .replace(/Narz[^a-zA-Z0-9\s<]+dzie/g, 'Narzędzie')
              .replace(/narz[^a-zA-Z0-9\s<]+dzi/g, 'narzędzi')
              .replace(/R[^a-zA-Z0-9\s<]+czka/g, 'Rączka')
              .replace(/przeci[^a-zA-Z0-9\s<]+gnij/g, 'przeciągnij')
              .replace(/P[^a-zA-Z0-9\s<]+ywaj[^a-zA-Z0-9\s<]+cy/g, 'Pływający')
              .replace(/Zako[^a-zA-Z0-9\s<]+cz/g, 'Zakończ')
              .replace(/przeprowad[^a-zA-Z0-9\s<]+/g, 'przeprowadź')
              .replace(/Spacj[^a-zA-Z0-9\s<]+/g, 'Spację')
              .replace(/[^a-zA-Z0-9\s<]+rodkowy/g, 'środkowy')
              .replace(/przesuwa[^a-zA-Z0-9\s<]+/g, 'przesuwać')
              .replace(/Przybli[^a-zA-Z0-9\s<]+anie/g, 'Przybliżanie')
              .replace(/Strza[^a-zA-Z0-9\s<]+ek/g, 'Strzałek')
              .replace(/P[^a-zA-Z0-9\s<]+ynne/g, 'Płynne')
              .replace(/zako[^a-zA-Z0-9\s<]+czona/g, 'zakończona')
              .replace(/w[^a-zA-Z0-9\s<]+asnych/g, 'własnych')
              .replace(/[^a-zA-Z0-9\s<]+cznie/g, 'łącznie')
              .replace(/Pomieszcze[^a-zA-Z0-9\s<]+/g, 'Pomieszczeń')
              .replace(/P[^a-zA-Z0-9\s<]+tle/g, 'Pętle')
              .replace(/P[^a-zA-Z0-9\s<]+tla/g, 'Pętla')
              .replace(/Wielko[^a-zA-Z0-9\s<]+/g, 'Wielkość: ')
              .replace(/pomieszcze[^a-zA-Z0-9\s<]+/g, 'pomieszczeń')
              .replace(/pod[^a-zA-Z0-9\s<]+og[^a-zA-Z0-9\s<]+wki/g, 'podłogówki')
              .replace(/obieg[^a-zA-Z0-9\s<]+w/g, 'obiegów')
              .replace(/Wielko[^a-zA-Z0-9\s<]+/g, 'Wielkość')
              .replace(/Usu[^a-zA-Z0-9\s<]+/g, 'Usuń')
              .replace(/Szczeg[^a-zA-Z0-9\s<]+owy/g, 'Szczegółowy')
              .replace(/podzia[^a-zA-Z0-9\s<]+u/g, 'podziału')
              .replace(/przechodz[^a-zA-Z0-9\s<]+/g, 'przechodzą')
              .replace(/Rozdzielacz[^a-zA-Z0-9\s<]+ \(/g, 'Rozdzielacze (')
              .replace(/Pon[^a-zA-Z0-9\s<]+w Kalibracj[^a-zA-Z0-9\s<]+/g, 'Ponów Kalibrację');
}

function repairObjectStrings(obj) {
    if (typeof obj === 'string') return repairString(obj);
    if (Array.isArray(obj)) return obj.map(repairObjectStrings);
    if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            newObj[key] = repairObjectStrings(obj[key]);
        }
        return newObj;
    }
    return obj;
}
 // Kopia DataURL tła dla zapisu .s1c
let pixelsPerMeter = 0; // Skala
let currentProjectName = 'Projekt Ogrzewania Podłogowego';
let currentProjectLocation = '';

// Stan aplikacji
const State = {
    IDLE: 'idle',
    CALIBRATING_PT1: 'calibrating_pt1',
    CALIBRATING_PT2: 'calibrating_pt2',
    DRAWING_ROOM: 'drawing_room',
    PLACING_MANIFOLD: 'placing_manifold',
    DRAWING_SUPPLY_PATH: 'drawing_supply_path'
};
let currentState = State.IDLE;

// NarzÄ‚â€žĂ˘â€žËdzia nawigacji
const Tool = {
    SELECT: 'select',
    PAN: 'pan'
};
let currentTool = Tool.SELECT;
let isSpacePanning = false;

// Zmienne tymczasowe dla narzędzi
let calibrationPoints = [];
let calibrationLine = null;
let currentRoomPolygon = null;
let currentRoomPoints = [];
let currentLines = [];
let rooms = [];
let selectedRoom = null;
let manifolds = [];
let currentSupplyPathPoints = [];
let currentSupplyLines = [];

// Elementy UI
const projectNameInput = document.getElementById('projectNameInput');
const projectLocationInput = document.getElementById('projectLocationInput');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const projectFileInput = document.getElementById('projectFileInput');
const openProjectBtn = document.getElementById('openProjectBtn');
const saveProjectBtn = document.getElementById('saveProjectBtn');

const calibrateBtn = document.getElementById('calibrateBtn');
const drawRoomBtn = document.getElementById('drawRoomBtn');
const calibrationInputArea = document.getElementById('calibrationInputArea');
const realDistanceInput = document.getElementById('realDistanceInput');
const confirmCalibrationBtn = document.getElementById('confirmCalibrationBtn');
const scaleInfo = document.getElementById('scaleInfo');
const roomsList = document.getElementById('roomsList');

const previewReportBtn = document.getElementById('previewReportBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const printReportBtn = document.getElementById('printReportBtn');
const generateOfferBtn = document.getElementById('generateOfferBtn');

const roomPropertiesPanel = document.getElementById('roomPropertiesPanel');
const roomNameInput = document.getElementById('roomNameInput');
const roomTextSizeInput = document.getElementById('roomTextSizeInput');
const roomHeatingMode = document.getElementById('roomHeatingMode');
const roomModeInfoArea = document.getElementById('roomModeInfoArea');
const roomHeatingParamsArea = document.getElementById('roomHeatingParamsArea');
const roomPipeSpacing = document.getElementById('roomPipeSpacing');
const roomSupplySpacing = document.getElementById('roomSupplySpacing');
const roomMaxLoopLength = document.getElementById('roomMaxLoopLength');
const roomLoopCount = document.getElementById('roomLoopCount');
const roomWarning = document.getElementById('roomWarning');
const saveRoomPropertiesBtn = document.getElementById('saveRoomPropertiesBtn');
const deleteRoomBtn = document.getElementById('deleteRoomBtn');

const addManifoldBtn = document.getElementById('addManifoldBtn');
const manifoldsList = document.getElementById('manifoldsList');
const roomManifoldSelect = document.getElementById('roomManifoldSelect');
const drawSupplyPathBtn = document.getElementById('drawSupplyPathBtn');
const clearSupplyPathBtn = document.getElementById('clearSupplyPathBtn');

const manifoldPropertiesPanel = document.getElementById('manifoldPropertiesPanel');
const manifoldNameInput = document.getElementById('manifoldNameInput');
const manifoldLoopCount = document.getElementById('manifoldLoopCount');
const manifoldRotation = document.getElementById('manifoldRotation');
const saveManifoldBtn = document.getElementById('saveManifoldBtn');
const deleteManifoldBtn = document.getElementById('deleteManifoldBtn');

let selectedManifold = null;

// Elementy paska nawigacji widoku
const toolSelectBtn = document.getElementById('toolSelectBtn');
const toolPanBtn = document.getElementById('toolPanBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomFitBtn = document.getElementById('zoomFitBtn');

// Elementy modala raportu
const reportModal = document.getElementById('reportModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalExportPdfBtn = document.getElementById('modalExportPdfBtn');
const modalPrintBtn = document.getElementById('modalPrintBtn');
const reportPaper = document.getElementById('reportPaper');
const printContainer = document.getElementById('printContainer');

// Nawigacja
let isDragging = false;
let lastPosX, lastPosY;

// Inicjalizacja po załadowaniu okna
window.onload = async function() {
    initCanvas();
    setupEventListeners();
    document.getElementById('canvas-container').addEventListener('contextmenu', e => e.preventDefault());
    
    // CRM Integration: Load active project
    const urlParams = new URLSearchParams(window.location.search);
    const activeProjectId = urlParams.get('projectId') || localStorage.getItem('lesa_active_project_id');
    if (activeProjectId) {
        try {
            let projects = [];
            if (window.ApiService) {
                projects = await window.ApiService.getProjects();
            } else {
                projects = JSON.parse(localStorage.getItem('lesa_projects')) || [];
            }
            const project = projects.find(p => p.id === activeProjectId);
            if (project) {
                let pName = project.projectTitle || project.title || project.clientName || 'Projekt Ogrzewania';
                if (window.ApiService && project.clientId) {
                    try {
                        const clients = await window.ApiService.getClients();
                        const client = clients.find(c => c.id === project.clientId);
                        if (client) pName = client.name + ' - ' + pName;
                    } catch(e) {}
                }
                
                let pLoc = project.investmentAddress || project.clientAddress || '';
                if (project.investmentCity) pLoc += ', ' + project.investmentCity;
                
                if (projectNameInput) projectNameInput.value = pName;
                if (projectLocationInput) projectLocationInput.value = pLoc;
                currentProjectName = pName;
                currentProjectLocation = pLoc;

                if (project.cad_file) {
                    try {
                        const baseUrl = window.ApiService ? window.ApiService.getBaseUrl().replace('api/', '') : '../';
                        const fileRes = await fetch(baseUrl + project.cad_file);
                        if (fileRes.ok) {
                            let projectData = await fileRes.json();
                            projectData = repairObjectStrings(projectData);
                            loadProjectData(projectData);
                            console.log('Auto-loaded CAD file from DB:', project.cad_file);
                        }
                    } catch(err) {
                        console.error('Error auto-loading CAD file:', err);
                    }
                }
            }
        } catch (e) {
            console.error('CRM load error:', e);
        }
    }
};

function initCanvas() {
    canvas = new fabric.Canvas('c', {
        width: 800,
        height: 600,
        selection: false,
        fireRightClick: true,
        stopContextMenu: true,
    });
    
    // Zoom (Scroll)
    canvas.on('mouse:wheel', function(opt) {
        var delta = opt.e.deltaY;
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.03) zoom = 0.03;
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        
        updateAllLabelsFontSize();
        
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });
    
    canvas.on('mouse:down', handleCanvasMouseDown);
    canvas.on('mouse:move', handleCanvasMouseMove);
    canvas.on('mouse:up', handleCanvasMouseUp);
}

function setupEventListeners() {
    // 1. Wgrywanie podkładu i obsługa projektu .s1c
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    
    openProjectBtn.addEventListener('click', () => projectFileInput.click());
    projectFileInput.addEventListener('change', handleProjectFileUpload);
    saveProjectBtn.addEventListener('click', saveProjectS1C);

    if (document.getElementById('labelFormatSelect')) {
        document.getElementById('labelFormatSelect').addEventListener('change', () => {
            recalculateAllRooms();
            canvas.renderAll();
        });
    }

    if (projectNameInput) {
        projectNameInput.addEventListener('input', () => {
            currentProjectName = projectNameInput.value.trim() || 'Projekt Ogrzewania Podłogowego';
        });
    }
    if (projectLocationInput) {
        projectLocationInput.addEventListener('input', () => {
            currentProjectLocation = projectLocationInput.value.trim();
        });
    }
    
    // 2. Kalibracja
    calibrateBtn.addEventListener('click', startCalibration);
    confirmCalibrationBtn.addEventListener('click', finishCalibration);
    realDistanceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') finishCalibration();
    });
    
    // 3. Rysowanie pomieszczeń i edycja
    drawRoomBtn.addEventListener('click', startDrawingRoom);
    saveRoomPropertiesBtn.addEventListener('click', saveRoomProperties);
    deleteRoomBtn.addEventListener('click', deleteSelectedRoom);
    
    // Automatyczne zapisywanie przy edycji
    roomNameInput.addEventListener('input', saveRoomProperties);
    roomTextSizeInput.addEventListener('input', saveRoomProperties);
    if (roomHeatingMode) {
        roomHeatingMode.addEventListener('change', () => {
            updateRoomPropertiesVisibility();
            saveRoomProperties();
        });
    }
    roomPipeSpacing.addEventListener('change', saveRoomProperties);
    roomSupplySpacing.addEventListener('input', saveRoomProperties);
    roomMaxLoopLength.addEventListener('input', saveRoomProperties);
    roomLoopCount.addEventListener('input', saveRoomProperties);
    
    // 3b. Rozdzielacze i trasy
    addManifoldBtn.addEventListener('click', startPlacingManifold);
    drawSupplyPathBtn.addEventListener('click', startDrawingSupplyPath);
    clearSupplyPathBtn.addEventListener('click', clearSelectedRoomSupplyPath);
    saveManifoldBtn.addEventListener('click', saveManifoldProperties);
    deleteManifoldBtn.addEventListener('click', () => {
        if (selectedManifold) deleteManifold(selectedManifold.id);
    });

    manifoldNameInput.addEventListener('input', saveManifoldProperties);
    manifoldLoopCount.addEventListener('input', saveManifoldProperties);
    manifoldRotation.addEventListener('input', saveManifoldProperties);
    
    // 4. NarzÄ‚â€žĂ˘â€žËdzia paska nawigacji widoku
    toolSelectBtn.addEventListener('click', () => setTool(Tool.SELECT));
    toolPanBtn.addEventListener('click', () => setTool(Tool.PAN));
    zoomInBtn.addEventListener('click', () => zoomStep(1.25));
    zoomOutBtn.addEventListener('click', () => zoomStep(0.8));
    zoomFitBtn.addEventListener('click', fitToScreen);
    
    // 5. Raport, PDF i Druk
    previewReportBtn.addEventListener('click', openReportModal);
    exportPdfBtn.addEventListener('click', () => exportToPDF());
    printReportBtn.addEventListener('click', () => printReport());
    if (generateOfferBtn) {
        generateOfferBtn.addEventListener('click', generateOfferData);
    }
    
    // Modal akcje
    closeModalBtn.addEventListener('click', closeReportModal);
    modalExportPdfBtn.addEventListener('click', () => exportToPDF());
    modalPrintBtn.addEventListener('click', () => printReport());
    
    reportModal.addEventListener('click', (e) => {
        if (e.target === reportModal) closeReportModal();
    });
    
    // Skróty klawiszowe
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

function setTool(tool) {
    currentTool = tool;
    if (tool === Tool.PAN) {
        toolPanBtn.classList.add('active');
        toolSelectBtn.classList.remove('active');
        if (currentState === State.IDLE) {
            canvas.defaultCursor = 'grab';
        }
    } else {
        toolSelectBtn.classList.add('active');
        toolPanBtn.classList.remove('active');
        if (currentState === State.IDLE) {
            canvas.defaultCursor = 'default';
        }
    }
}

function handleKeyDown(e) {
    const isInputActive = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);
    
    if (e.key === 'Escape') {
        if (!reportModal.classList.contains('hidden')) {
            closeReportModal();
        } else if (currentState === State.DRAWING_ROOM) {
            stopDrawingRoom();
        } else if (currentState === State.DRAWING_SUPPLY_PATH) {
            stopDrawingSupplyPath();
        } else if (currentState === State.PLACING_MANIFOLD) {
            stopPlacingManifold();
        } else if (currentState.startsWith('calibrating')) {
            resetCalibrationState();
        }
        return;
    }
    
    if (isInputActive) return;
    
    // Klawisze nawigacji
    if (e.code === 'Space' && !isSpacePanning) {
        isSpacePanning = true;
        canvas.defaultCursor = 'grab';
        e.preventDefault();
    } else if (e.key === 'v' || e.key === 'V') {
        setTool(Tool.SELECT);
    } else if (e.key === 'h' || e.key === 'H') {
        setTool(Tool.PAN);
    } else if (e.key === 'f' || e.key === 'F') {
        fitToScreen();
    } else if (e.key === '+' || e.key === '=') {
        zoomStep(1.25);
    } else if (e.key === '-' || e.key === '_') {
        zoomStep(0.8);
    } else if (e.key.startsWith('Arrow')) {
        // Przesuwanie strzałkami
        const step = e.shiftKey ? 100 : 40;
        const vpt = canvas.viewportTransform;
        if (e.key === 'ArrowLeft') vpt[4] += step;
        if (e.key === 'ArrowRight') vpt[4] -= step;
        if (e.key === 'ArrowUp') vpt[5] += step;
        if (e.key === 'ArrowDown') vpt[5] -= step;
        canvas.requestRenderAll();
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    if (e.code === 'Space') {
        isSpacePanning = false;
        canvas.defaultCursor = (currentTool === Tool.PAN) ? 'grab' : (currentState !== State.IDLE ? 'crosshair' : 'default');
    }
}

function zoomStep(factor) {
    if (!canvas) return;
    const container = document.getElementById('canvas-container');
    const center = {
        x: container.offsetWidth / 2,
        y: container.offsetHeight / 2
    };
    let zoom = canvas.getZoom() * factor;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.03) zoom = 0.03;
    canvas.zoomToPoint(center, zoom);
    updateAllLabelsFontSize();
}

function fitToScreen() {
    if (!canvas || !currentImage) return;
    
    const container = document.getElementById('canvas-container');
    const containerWidth = container.offsetWidth || 800;
    const containerHeight = container.offsetHeight || 600;
    
    const zoomX = containerWidth / currentImage.width;
    const zoomY = containerHeight / currentImage.height;
    const fitZoom = Math.min(zoomX, zoomY) * 0.95;
    
    const offsetX = (containerWidth - currentImage.width * fitZoom) / 2;
    const offsetY = (containerHeight - currentImage.height * fitZoom) / 2;
    
    canvas.setViewportTransform([fitZoom, 0, 0, fitZoom, offsetX, offsetY]);
    updateAllLabelsFontSize();
    canvas.requestRenderAll();
}

function updateActionButtonsState() {
    const hasImage = currentImage !== null;
    const hasScale = pixelsPerMeter > 0;
    const hasRooms = rooms.length > 0;
    
    if (saveProjectBtn) saveProjectBtn.disabled = !hasImage;
    if (calibrateBtn) calibrateBtn.disabled = !hasImage;
    if (drawRoomBtn) drawRoomBtn.disabled = !hasScale;
    if (addManifoldBtn) addManifoldBtn.disabled = !hasScale;
    
    if (previewReportBtn) previewReportBtn.disabled = !hasRooms;
    if (exportPdfBtn) exportPdfBtn.disabled = !hasRooms;
    if (printReportBtn) printReportBtn.disabled = !hasRooms;
    if (typeof generateOfferBtn !== 'undefined' && generateOfferBtn) {
        generateOfferBtn.disabled = !hasRooms;
    }
}

// ==========================================
// 1. WCZYTYWANIE PODKĂ„ąĂ‚ÂADU (JPG, PNG, PDF)
// ==========================================
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
        loadPdf(file);
    } else if (file.type.startsWith('image/')) {
        loadImage(file);
    } else {
        alert('Nieobsługiwany format pliku. Wybierz plik JPG, PNG lub PDF.');
    }
    fileInput.value = '';
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(f) {
        const data = f.target.result;
        currentImageDataUrl = data;
        fabric.Image.fromURL(data, function(img) {
            setupCanvasWithImage(img);
        });
    };
    reader.readAsDataURL(file);
}

async function loadPdf(file) {
    const fileReader = new FileReader();
    fileReader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        try {
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            const page = await pdf.getPage(1);
            
            const scale = 3.0; // Wysoka rozdzielczość dla ostrości
            const viewport = page.getViewport({ scale: scale });
            
            const tempCanvas = document.createElement('canvas');
            const context = tempCanvas.getContext('2d');
            tempCanvas.height = viewport.height;
            tempCanvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            const dataUrl = tempCanvas.toDataURL('image/png');
            currentImageDataUrl = dataUrl;
            fabric.Image.fromURL(dataUrl, function(img) {
                setupCanvasWithImage(img);
            });
            
        } catch (error) {
            console.error('Błąd podczas ładowania PDF:', error);
            alert('Wystąpił błąd podczas ładowania pliku PDF.');
        }
    };
    fileReader.readAsArrayBuffer(file);
}

function setupCanvasWithImage(img) {
    canvas.clear();
    canvas.setWidth(img.width);
    canvas.setHeight(img.height);
    
    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    currentImage = img;
    
    fitToScreen();
    
    resetScale();
    rooms = [];
    selectedRoom = null;
    hideRoomProperties();
    renderRoomsList();
    updateActionButtonsState();
    setTool(Tool.SELECT);
}

// ==========================================
// 2. ZAPIS I ODCZYT PROJEKTU .S1C (JSON)
// ==========================================
async function saveProjectS1C() {
    if (!currentImage) {
        alert('Brak aktywnego projektu do zapisania!');
        return;
    }
    
    projectLevels[currentLevelIndex].state = captureCurrentLevelState();
    
    const projectData = {
        format: 'LeSa-CAD-s1c-multilevel',
        version: '2.0',
        timestamp: Date.now(),
        projectName: currentProjectName,
        installationLocation: currentProjectLocation,
        levels: projectLevels,
        currentLevelIndex: currentLevelIndex
    };
    
    const jsonString = JSON.stringify(projectData, null, 2);
    
    // Save to CRM if possible
    const urlParams = new URLSearchParams(window.location.search);
    const activeProjectId = urlParams.get('projectId') || localStorage.getItem('lesa_active_project_id');
    
    if (window.ApiService && activeProjectId) {
        try {
            const res = await window.ApiService.saveCadProject(activeProjectId, currentProjectName, jsonString);
            const combinedData = getCombinedReportData();
            const cadDataObj = {
                area: parseFloat(combinedData.totalArea),
                loopsCount: combinedData.rooms.reduce((acc, r) => acc + (r.loopCount || 0), 0),
                pipeLength: combinedData.totalPipeNet,
                manifolds: combinedData.manifolds.length,
                rooms: combinedData.rooms
            };
            let projects = await window.ApiService.getProjects();
            let pIdx = projects.findIndex(p => p.id === activeProjectId);
            if (pIdx >= 0) {
                if (res && res.file && res.file.url) {
                    projects[pIdx].cad_file = res.file.url;
                }
                projects[pIdx].cadData = cadDataObj;
                projects[pIdx].cad_data = JSON.stringify(cadDataObj);
                projects[pIdx].clientName = currentProjectName;
                projects[pIdx].clientAddress = currentProjectLocation;
                await window.ApiService.saveProject(projects[pIdx]);
            }
            alert('Projekt .s1c oraz dane rozdzielaczy i pętli zostały zapisane w systemie!');
            /*
            if (res && res.success) {
                // Zapobiega nadpisaniu cad_file przez inne funkcje zapisu
                if (res.file && res.file.url) {
                    let projects = JSON.parse(localStorage.getItem('lesa_projects') || '[]');
                                        let pIdx = projects.findIndex(p => p.id === activeProjectId);
                    if (pIdx >= 0) {
                        projects[pIdx].cad_file = res.file.url;
                        const combinedData = getCombinedReportData();
                        projects[pIdx].cadData = {
                            area: parseFloat(combinedData.totalArea),
                            loopsCount: combinedData.rooms.reduce((acc, r) => acc + (r.loopCount || 0), 0),
                            pipeLength: combinedData.totalPipeNet,
                            manifolds: combinedData.manifolds.length,
                            rooms: combinedData.rooms
                        };
                        localStorage.setItem('lesa_projects', JSON.stringify(projects));
                    }
                }
                alert('Projekt .s1c został zapisany w systemie CRM! Trwa pobieranie kopii lokalnej...');
            */
        } catch (e) {
            console.error('Błąd zapisu do CRM:', e);
        }
    } else if (activeProjectId) {
        let projects = JSON.parse(localStorage.getItem('lesa_projects') || '[]');
        let pIdx = projects.findIndex(p => p.id === activeProjectId);
        if (pIdx >= 0) {
            const combinedData = getCombinedReportData();
            projects[pIdx].cadData = {
                area: parseFloat(combinedData.totalArea),
                loopsCount: combinedData.rooms.reduce((acc, r) => acc + (r.loopCount || 0), 0),
                pipeLength: combinedData.totalPipeNet,
                manifolds: combinedData.manifolds.length,
                rooms: combinedData.rooms
            };
            localStorage.setItem('lesa_projects', JSON.stringify(projects));
        }
    }



    
    // Zawsze pobieraj kopię lokalną
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    const cleanProjName = (currentProjectName || 'projekt_ogrzewania').replace(/[^a-zA-Z0-9ąćÄ‚â€žĂ˘â€žËłńóśźżÄ‚â€žĂ˘â‚¬ĹľÄ‚â€žĂ˘â‚¬Â Ä‚â€žĂ‚ÂĂ„ąĂ‚ÂĂ„ąĂ‚ÂÓŚŹŻ_-]/g, '_').substring(0, 30);
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${cleanProjName || 'projekt_ogrzewania'}_${dateStr}.s1c`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleProjectFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            let projectData = JSON.parse(evt.target.result);
              projectData = repairObjectStrings(projectData);
            loadProjectData(projectData);
        } catch (err) {
            console.error('Błąd parsowania pliku .s1c:', err);
            alert('Wybrany plik nie jest prawidłowym plikiem projektu LeSa-CAD (.s1c).');
        }
    };
    reader.readAsText(file);
    projectFileInput.value = '';
}

function loadProjectData(data) {
    if (data.format === 'LeSa-CAD-s1c-multilevel') {
        let replaceAll = true;
        if (projectLevels.length > 1 || currentLevelIndex > 0) {
            replaceAll = confirm("Plik zawiera projekt (zapisany jako wielopoziomowy).\nCzy chcesz zastąpić CAŁY swój obecny projekt tym plikiem?\n\n[OK] Zastąp wszystkie poziomy\n[Anuluj] Wczytaj tylko aktywną część tego pliku do BIEŻĄCEJ karty");
        }
        
        if (replaceAll) {
            projectLevels = data.levels;
            currentLevelIndex = data.currentLevelIndex || 0;
            updateLevelTabsUI();
            if (projectLevels[currentLevelIndex].state) {
                loadSingleLevelState(projectLevels[currentLevelIndex].state);
            } else {
                canvas.clear();
                currentImage = null;
                currentImageDataUrl = null;
                pixelsPerMeter = 0;
                if (scaleInfo) scaleInfo.textContent = 'Skala: Nieustawiona';
                rooms = [];
                manifolds = [];
                selectedRoom = null;
            }
        } else {
            // Inject only the active state from the file into the current tab
            const stateToInject = data.levels[data.currentLevelIndex || 0].state;
            projectLevels[currentLevelIndex].state = stateToInject;
            loadSingleLevelState(stateToInject);
        }
    } else {
        projectLevels[currentLevelIndex].state = data;
        loadSingleLevelState(data);
    }
}

function loadSingleLevelState(projectData) {
    if (!projectData || !projectData.backgroundImage || !projectData.backgroundImage.dataUrl) {
        alert('Nieprawidłowa struktura pliku projektu .s1c.');
        return;
    }
    
    currentImageDataUrl = projectData.backgroundImage.dataUrl;
    currentProjectName = projectData.projectName || 'Projekt Ogrzewania Podłogowego';
    currentProjectLocation = projectData.installationLocation || projectData.location || '';
    if (projectNameInput) projectNameInput.value = currentProjectName;
    if (projectLocationInput) projectLocationInput.value = currentProjectLocation;
    
    fabric.Image.fromURL(projectData.backgroundImage.dataUrl, function(img) {
        canvas.clear();
        canvas.setWidth(img.width);
        canvas.setHeight(img.height);
        
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        currentImage = img;
        
        fitToScreen();
        
        // Odtwórz skalÄ‚â€žĂ˘â€žË
        pixelsPerMeter = projectData.pixelsPerMeter || 0;
        if (pixelsPerMeter > 0) {
            scaleInfo.textContent = projectData.scaleInfoText || `Skala: 1m = ${pixelsPerMeter.toFixed(2)}px`;
            calibrateBtn.textContent = 'Ponów Kalibrację';
        } else {
            resetScale();
        }
        
        // Odtwórz rozdzielacze
        manifolds = [];
        manifoldsList.innerHTML = '';
        if (Array.isArray(projectData.manifolds)) {
            projectData.manifolds.forEach(mData => {
                addManifoldToCanvas(mData.x, mData.y); 
                const man = manifolds[manifolds.length - 1];
                man.id = mData.id;
                man.name = mData.name;
                man.loopCount = mData.loopCount || 5;
                man.rotation = mData.rotation || 0;
                man.group._manifoldId = mData.id;
                updateManifoldAppearance(man);
            });
        }
        renderManifoldsList();
        populateRoomManifoldSelect();

        // Odtwórz pomieszczenia
        rooms = [];
        selectedRoom = null;
        
        if (Array.isArray(projectData.rooms)) {
            projectData.rooms.forEach(rData => {
                const polygon = new fabric.Polygon(rData.points, {
                    fill: 'rgba(0, 173, 181, 0.3)',
                    stroke: '#00ADB5',
                    strokeWidth: 2 / canvas.getZoom(),
                    selectable: true,
                    hasControls: false,
                    lockMovementX: true,
                    lockMovementY: true
                });
                
                polygon._roomId = rData.id;
                canvas.add(polygon);
                
                const room = {
                    id: rData.id,
                    name: rData.name || `Pomieszczenie ${rooms.length + 1}`,
                    heatingMode: rData.heatingMode || 'heating',
                    polygon: polygon,
                    points: [...rData.points],
                    pipeSpacing: rData.pipeSpacing || 100,
                    supplySpacing: rData.supplySpacing || 50,
                    maxLoopLength: rData.maxLoopLength || 100,
                    customLoopCount: rData.customLoopCount || null,
                    textSize: rData.textSize || 15,
                    manifoldId: rData.manifoldId || null,
                    supplyPathPoints: rData.supplyPathPoints || null,
                    supplyLengthPixels: rData.supplyLengthPixels || 0
                };
                
                rooms.push(room);
                recalculateRoom(room);
                if (room.supplyPathPoints) {
                    renderSupplyPath(room);
                }
            });
        }
        
        recalculateAllRooms();
        renderRoomsList();
        hideRoomProperties();
        updateActionButtonsState();
        setTool(Tool.SELECT);
        
        alert(`Projekt "${currentProjectName}" został wczytany pomyślnie! Liczba pomieszczeń ${rooms.length}`);
    });
}

// ==========================================
// 3. NAWIGACJA, PAN I PRZESUWANIE PODKĂ„ąĂ‚ÂADU
// ==========================================
function handleCanvasMouseDown(opt) {
    var evt = opt.e;
    
    // Warunki uruchomienia przesuwania (PAN):
    // 1. Aktywne narzędzie PAN (Rączka)
    // 2. WciśniÄ‚â€žĂ˘â€žËta Spacja
    // 3. środkowy przycisk myszy
    // 4. Alt + Lewy przycisk
    // 5. Prawy przycisk myszy (gdy nie rysujemy pomieszczenia)
    const shouldPan = (currentTool === Tool.PAN && evt.button === 0 && currentState === State.IDLE) ||
                      isSpacePanning ||
                      evt.button === 1 ||
                      (evt.button === 0 && evt.altKey) ||
                      (evt.button === 2 && currentState === State.IDLE);
    
    if (shouldPan) {
        isDragging = true;
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        canvas.defaultCursor = 'grabbing';
        return;
    }
    
    // Prawy przycisk w trakcie rysowania -> Zakończ operację
    if (currentState === State.DRAWING_ROOM && evt.button === 2) {
        finishRoom();
        return;
    }
    if (currentState === State.DRAWING_SUPPLY_PATH && evt.button === 2) {
        finishSupplyPath();
        return;
    }
    
    // KlikniÄ‚â€žĂ˘â€žËcia lewym przyciskiem myszy
    if (evt.button === 0 && !evt.altKey) {
        if (currentState !== State.IDLE) {
            handleToolClick(opt);
        } else {
            // Zaznaczanie pomieszczeń w trybie SELECT
            if (opt.target && opt.target._roomId) {
                selectRoom(opt.target._roomId);
            } else if (opt.target && opt.target._manifoldId) {
                selectManifold(opt.target._manifoldId);
            } else {
                deselectRoom();
                deselectManifold();
            }
        }
    }
}

function handleCanvasMouseMove(opt) {
    if (isDragging) {
        var e = opt.e;
        var vpt = canvas.viewportTransform;
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = e.clientX;
        lastPosY = e.clientY;
        return;
    }
    
    handleToolMove(opt);
}

function handleCanvasMouseUp(opt) {
    if (isDragging) {
        isDragging = false;
        canvas.selection = true;
        canvas.defaultCursor = (currentTool === Tool.PAN || isSpacePanning) ? 'grab' : (currentState !== State.IDLE ? 'crosshair' : 'default');
    }
}

// ==========================================
// 4. KALIBRACJA SKALI
// ==========================================
function startCalibration() {
    if (currentState === State.DRAWING_ROOM) stopDrawingRoom();
    
    setTool(Tool.SELECT);
    currentState = State.CALIBRATING_PT1;
    calibrationPoints = [];
    if (calibrationLine) {
        canvas.remove(calibrationLine);
        calibrationLine = null;
    }
    
    calibrateBtn.classList.add('active');
    calibrateBtn.textContent = 'Kliknij 1. punkt';
    calibrationInputArea.classList.add('hidden');
    canvas.defaultCursor = 'crosshair';
    deselectRoom();
}

function resetCalibrationState() {
    currentState = State.IDLE;
    calibrateBtn.classList.remove('active');
    calibrateBtn.textContent = pixelsPerMeter > 0 ? 'Ponów Kalibrację' : 'Rozpocznij Kalibrację';
    canvas.defaultCursor = (currentTool === Tool.PAN) ? 'grab' : 'default';
    if (calibrationLine) {
        canvas.remove(calibrationLine);
        calibrationLine = null;
    }
    calibrationPoints = [];
    canvas.renderAll();
}

function handleToolClick(o) {
    const pointer = canvas.getPointer(o.e);
    
    if (currentState === State.CALIBRATING_PT1) {
        calibrationPoints.push({ x: pointer.x, y: pointer.y });
        currentState = State.CALIBRATING_PT2;
        calibrateBtn.textContent = 'Kliknij 2. punkt';
        
    } else if (currentState === State.CALIBRATING_PT2) {
        calibrationPoints.push({ x: pointer.x, y: pointer.y });
        currentState = State.IDLE;
        calibrateBtn.classList.remove('active');
        calibrateBtn.textContent = 'Kalibracja zakończona';
        canvas.defaultCursor = (currentTool === Tool.PAN) ? 'grab' : 'default';
        
        calibrationInputArea.classList.remove('hidden');
        realDistanceInput.focus();
        
    } else if (currentState === State.DRAWING_ROOM) {
        addRoomPoint(o.e);
    } else if (currentState === State.PLACING_MANIFOLD) {
        addManifoldToCanvas(pointer.x, pointer.y);
    } else if (currentState === State.DRAWING_SUPPLY_PATH) {
        addSupplyPathPoint(o.e);
    }
}

function handleToolMove(o) {
    if (currentState === State.CALIBRATING_PT2 && calibrationPoints.length === 1) {
        const pointer = canvas.getPointer(o.e);
        
        if (calibrationLine) canvas.remove(calibrationLine);
        
        calibrationLine = new fabric.Line([
            calibrationPoints[0].x, calibrationPoints[0].y,
            pointer.x, pointer.y
        ], {
            stroke: 'red',
            strokeWidth: 2 / canvas.getZoom(),
            selectable: false,
            evented: false
        });
        
        canvas.add(calibrationLine);
        canvas.renderAll();
    } else if (currentState === State.DRAWING_ROOM && currentRoomPoints.length > 0) {
        const { snapX, snapY } = getOrtoCoordinates(o.e);
        
        if (currentLines.length > currentRoomPoints.length) {
            const lastLine = currentLines[currentLines.length - 1];
            lastLine.set({ x2: snapX, y2: snapY });
            canvas.renderAll();
        } else {
            const lastPoint = currentRoomPoints[currentRoomPoints.length - 1];
            const line = new fabric.Line([lastPoint.x, lastPoint.y, snapX, snapY], {
                stroke: '#00ADB5',
                strokeWidth: 2 / canvas.getZoom(),
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false
            });
            currentLines.push(line);
            canvas.add(line);
        }
    } else if (currentState === State.DRAWING_SUPPLY_PATH && currentSupplyPathPoints.length > 0) {
        const { snapX, snapY } = getOrtoCoordinatesSupply(o.e);
        
        if (currentSupplyLines.length > currentSupplyPathPoints.length) {
            const lastLine = currentSupplyLines[currentSupplyLines.length - 1];
            lastLine.set({ x2: snapX, y2: snapY });
            canvas.renderAll();
        } else {
            const lastPoint = currentSupplyPathPoints[currentSupplyPathPoints.length - 1];
            const line = new fabric.Line([lastPoint.x, lastPoint.y, snapX, snapY], {
                stroke: '#e11d48',
                strokeWidth: 3 / canvas.getZoom(),
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false
            });
            currentSupplyLines.push(line);
            canvas.add(line);
        }
    }
}

function finishCalibration() {
    const cm = parseFloat(realDistanceInput.value);
    if (!cm || cm <= 0) {
        alert('Podaj prawidłową dodatnią wartość w centymetrach.');
        return;
    }
    
    const meters = cm / 100.0;
    
    const dx = calibrationPoints[1].x - calibrationPoints[0].x;
    const dy = calibrationPoints[1].y - calibrationPoints[0].y;
    const pixels = Math.sqrt(dx*dx + dy*dy);
    
    pixelsPerMeter = pixels / meters;
    scaleInfo.textContent = `Skala: 1m = ${pixelsPerMeter.toFixed(2)}px`;
    
    calibrationInputArea.classList.add('hidden');
    calibrateBtn.textContent = 'Ponów Kalibrację';
    
    if (calibrationLine) {
        canvas.remove(calibrationLine);
        calibrationLine = null;
    }
    
    updateActionButtonsState();
    recalculateAllRooms();
}

function resetScale() {
    pixelsPerMeter = 0;
    scaleInfo.textContent = 'Skala: Nieustawiona';
    updateActionButtonsState();
}

// ==========================================
// 4a. ROZDZIELACZE I TRASY DOBIEGOWE
// ==========================================
function startPlacingManifold() {
    if (pixelsPerMeter === 0) {
        alert('Najpierw przeprowadź kalibrację skali!');
        return;
    }
    setTool(Tool.SELECT);
    currentState = State.PLACING_MANIFOLD;
    canvas.selection = false;
    addManifoldBtn.classList.add('active');
    addManifoldBtn.textContent = 'Kliknij na planie';
    canvas.defaultCursor = 'crosshair';
    deselectRoom();
}

function stopPlacingManifold() {
    currentState = State.IDLE;
    canvas.selection = (currentTool === Tool.SELECT);
    addManifoldBtn.classList.remove('active');
    addManifoldBtn.textContent = 'Postaw Rozdzielacz';
    canvas.defaultCursor = (currentTool === Tool.PAN) ? 'grab' : 'default';
}

function addManifoldToCanvas(x, y) {
    const manifoldId = Date.now();
    const manifoldName = `Rozdzielacz ${manifolds.length + 1}`;
    
    const manifold = {
        id: manifoldId,
        name: manifoldName,
        x: x,
        y: y,
        loopCount: 5,
        rotation: 0,
        group: null
    };
    
    manifolds.push(manifold);
    updateManifoldAppearance(manifold);
    
    stopPlacingManifold();
    renderManifoldsList();
    populateRoomManifoldSelect();
}

function updateManifoldAppearance(man) {
    const wMeters = 0.35 + (man.loopCount * 0.05);
    const dMeters = 0.15;
    
    const wPx = wMeters * pixelsPerMeter;
    const dPx = dMeters * pixelsPerMeter;
    
    const rectSupply = new fabric.Rect({
        left: -wPx/2, top: -dPx/2, width: wPx, height: dPx/2,
        fill: '#e11d48'
    });
    const rectReturn = new fabric.Rect({
        left: -wPx/2, top: 0, width: wPx, height: dPx/2,
        fill: '#2563eb'
    });
    const text = new fabric.Text('R', {
        fontSize: Math.max(10, dPx * 0.6), fill: 'white', originX: 'center', originY: 'center',
        fontWeight: 'bold', top: 0
    });
    
    let prevLeft = man.x;
    let prevTop = man.y;
    let prevAngle = man.rotation;
    
    if (man.group) {
        prevLeft = man.group.left;
        prevTop = man.group.top;
        prevAngle = man.group.angle;
        if (canvas.contains(man.group)) {
            canvas.remove(man.group);
        }
    }
    
    man.group = new fabric.Group([rectSupply, rectReturn, text], {
        left: prevLeft,
        top: prevTop,
        originX: 'center',
        originY: 'center',
        selectable: true,
        hasControls: true,
        lockScalingX: true,
        lockScalingY: true,
        angle: prevAngle
    });
    
    man.group._manifoldId = man.id;
    man.group.setControlsVisibility({
        mt: false, mb: false, ml: false, mr: false,
        tl: false, tr: false, bl: false, br: false,
        mtr: true
    });
    
    man.group.on('moving', function() {
        man.x = man.group.left;
        man.y = man.group.top;
        updateConnectedSupplyPaths(man);
    });
    
    man.group.on('rotating', function() {
        man.rotation = man.group.angle;
        if (selectedManifold && selectedManifold.id === man.id) {
            manifoldRotation.value = Math.round(man.rotation);
        }
    });
    
    man.group.on('modified', function() {
        man.x = man.group.left;
        man.y = man.group.top;
        man.rotation = man.group.angle;
        if (selectedManifold && selectedManifold.id === man.id) {
            manifoldRotation.value = Math.round(man.rotation);
        }
        updateConnectedSupplyPaths(man);
    });
    
    canvas.add(man.group);
    canvas.renderAll();
}

function updateConnectedSupplyPaths(man) {
    rooms.forEach(r => {
        if (String(r.manifoldId) === String(man.id) && r.supplyPathPoints && r.supplyPathPoints.length > 0) {
            r.supplyPathPoints[0] = { x: man.group.left, y: man.group.top };
            renderSupplyPath(r);
            recalculateRoom(r);
        }
    });
}

function selectManifold(id) {
    if (currentState !== State.IDLE) return;
    
    deselectRoom(); 
    
    const man = manifolds.find(m => m.id == id);
    if (!man) return;
    
    selectedManifold = man;
    manifoldPropertiesPanel.classList.remove('hidden');
    
    manifoldNameInput.value = man.name;
    manifoldLoopCount.value = man.loopCount;
    manifoldRotation.value = man.rotation;
}

function deselectManifold() {
    selectedManifold = null;
    manifoldPropertiesPanel.classList.add('hidden');
}

function saveManifoldProperties() {
    if (!selectedManifold) return;
    
    selectedManifold.name = manifoldNameInput.value;
    selectedManifold.loopCount = parseInt(manifoldLoopCount.value) || 5;
    selectedManifold.rotation = parseInt(manifoldRotation.value) || 0;
    
    updateManifoldAppearance(selectedManifold);
    renderManifoldsList();
    populateRoomManifoldSelect();
}

function renderManifoldsList() {
    manifoldsList.innerHTML = '';
    manifolds.forEach((man) => {
        const li = document.createElement('li');
        li.className = 'room-item';
        li.innerHTML = `
            <div class="room-title" style="flex: 1; cursor: pointer;" onclick="selectManifold('${man.id}')">${man.name}</div>
            <button class="btn danger btn-compact" onclick="deleteManifold('${man.id}')" style="padding: 2px 6px; font-size: 10px;">Usuń</button>
        `;
        manifoldsList.appendChild(li);
    });
}

function deleteManifold(id) {
    const man = manifolds.find(m => m.id == id);
    if (!man) return;
    
    if (confirm(`Usunąć ${man.name}?`)) {
        if (man.group) canvas.remove(man.group);
        manifolds = manifolds.filter(m => m.id != id);
        
        // Wyczyść powiązania z pomieszczeniami
        rooms.forEach(r => {
            if (String(r.manifoldId) === String(id)) {
                r.manifoldId = null;
                clearSupplyPathData(r);
                recalculateRoom(r);
            }
        });
        
        renderManifoldsList();
        populateRoomManifoldSelect();
        if (selectedRoom) selectRoom(selectedRoom.id);
    }
}

function populateRoomManifoldSelect(explicitVal = null) {
    const currentVal = explicitVal !== null ? String(explicitVal) : String(roomManifoldSelect.value || '');
    roomManifoldSelect.innerHTML = '<option value="">Brak (wybierz z listy)</option>';
    manifolds.forEach(man => {
        const option = document.createElement('option');
        option.value = String(man.id);
        option.textContent = man.name;
        roomManifoldSelect.appendChild(option);
    });
    roomManifoldSelect.value = currentVal;
}

roomManifoldSelect.addEventListener('change', (e) => {
    if (!selectedRoom) return;
    
    const val = e.target.value;
    if (val) {
        selectedRoom.manifoldId = String(val);
    } else {
        selectedRoom.manifoldId = null;
        clearSupplyPathData(selectedRoom);
    }
    recalculateRoom(selectedRoom);
});

// Magistrala
function startDrawingSupplyPath() {
    if (!selectedRoom) return;
    if (!selectedRoom.manifoldId) {
        alert('Przypisz najpierw rozdzielacz do tego pomieszczenia!');
        return;
    }
    
    const man = manifolds.find(m => String(m.id) === String(selectedRoom.manifoldId));
    if (!man) return;
    
    setTool(Tool.SELECT);
    currentState = State.DRAWING_SUPPLY_PATH;
    canvas.selection = false;
    drawSupplyPathBtn.classList.add('active');
    drawSupplyPathBtn.textContent = 'Rysowanie... (PPM by zak.)';
    canvas.defaultCursor = 'crosshair';
    
    // Usuń starą
    clearSupplyPathData(selectedRoom);
    
    currentSupplyPathPoints = [{ x: man.group.left, y: man.group.top }];
    currentSupplyLines = [];
}

function stopDrawingSupplyPath() {
    currentState = State.IDLE;
    canvas.selection = (currentTool === Tool.SELECT);
    drawSupplyPathBtn.classList.remove('active');
    drawSupplyPathBtn.textContent = 'Rysuj Magistralę';
    canvas.defaultCursor = (currentTool === Tool.PAN) ? 'grab' : 'default';
    
    currentSupplyLines.forEach(line => canvas.remove(line));
    currentSupplyLines = [];
    currentSupplyPathPoints = [];
    
    const objects = canvas.getObjects();
    objects.forEach(obj => {
        if (obj.type === 'circle' && obj.fill === '#e11d48') canvas.remove(obj);
    });
    
    canvas.renderAll();
}

function getOrtoCoordinatesSupply(e) {
    const pointer = canvas.getPointer(e);
    let snapX = pointer.x;
    let snapY = pointer.y;
    
    if (currentSupplyPathPoints.length > 0 && !e.shiftKey) {
        const lastPoint = currentSupplyPathPoints[currentSupplyPathPoints.length - 1];
        const dx = Math.abs(pointer.x - lastPoint.x);
        const dy = Math.abs(pointer.y - lastPoint.y);
        
        if (dx < dy) {
            snapX = lastPoint.x;
        } else {
            snapY = lastPoint.y;
        }
    }
    return { snapX, snapY };
}

function addSupplyPathPoint(e) {
    const { snapX, snapY } = getOrtoCoordinatesSupply(e);
    
    currentSupplyPathPoints.push({ x: snapX, y: snapY });
    
    const circle = new fabric.Circle({
        radius: 4 / canvas.getZoom(),
        fill: '#e11d48',
        stroke: '#ffffff',
        strokeWidth: 1 / canvas.getZoom(),
        left: snapX,
        top: snapY,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        opacity: 0.8
    });
    canvas.add(circle);
    
    if (currentSupplyLines.length > 0) {
        const lastLine = currentSupplyLines[currentSupplyLines.length - 1];
        lastLine.set({ strokeDashArray: null, x2: snapX, y2: snapY });
    }
}

function finishSupplyPath() {
    if (!selectedRoom || currentSupplyPathPoints.length < 2) {
        stopDrawingSupplyPath();
        return;
    }
    
    // Oblicz dystans w pikselach
    let lengthPixels = 0;
    for (let i = 1; i < currentSupplyPathPoints.length; i++) {
        const p1 = currentSupplyPathPoints[i-1];
        const p2 = currentSupplyPathPoints[i];
        lengthPixels += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    
    selectedRoom.supplyPathPoints = [...currentSupplyPathPoints];
    selectedRoom.supplyLengthPixels = lengthPixels;
    
    renderSupplyPath(selectedRoom);
    
    stopDrawingSupplyPath();
    recalculateRoom(selectedRoom);
}

function renderSupplyPath(room) {
    if (!room.supplyPathPoints || room.supplyPathPoints.length < 2) return;
    
    // Grupa dla magistrali
    if (room.supplyGroup) canvas.remove(room.supplyGroup);
    
    room.supplyGroup = new fabric.Group([], {
        selectable: false,
        evented: false
    });
    
    const supplySpacingPx = (room.supplySpacing || 50) / 1000 * pixelsPerMeter;
    const loops = room.loopCount || 1;
    
    // total width of the bundle = (loops * 2 - 1) * supplySpacingPx
    const bundleWidthPx = (loops * 2 - 1) * supplySpacingPx;
    
    for (let i = 1; i < room.supplyPathPoints.length; i++) {
        const p1 = room.supplyPathPoints[i-1];
        const p2 = room.supplyPathPoints[i];
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        
        const nx = -dy / len;
        const ny = dx / len;
        
        for (let l = 0; l < loops; l++) {
            // Zasilanie (czerwone)
            const offset1 = -bundleWidthPx/2 + (l * 2) * supplySpacingPx;
            const lineSupply = new fabric.Line([
                p1.x + nx * offset1, p1.y + ny * offset1,
                p2.x + nx * offset1, p2.y + ny * offset1
            ], { stroke: '#e11d48', strokeWidth: 3 / canvas.getZoom(), strokeLineCap: 'round', strokeLineJoin: 'round' });
            
            // Powrót (niebieskie)
            const offset2 = -bundleWidthPx/2 + (l * 2 + 1) * supplySpacingPx;
            const lineReturn = new fabric.Line([
                p1.x + nx * offset2, p1.y + ny * offset2,
                p2.x + nx * offset2, p2.y + ny * offset2
            ], { stroke: '#2563eb', strokeWidth: 3 / canvas.getZoom(), strokeLineCap: 'round', strokeLineJoin: 'round' });
            
            room.supplyGroup.addWithUpdate(lineSupply);
            room.supplyGroup.addWithUpdate(lineReturn);
        }
    }
    
    canvas.add(room.supplyGroup);
    room.supplyGroup.sendToBack();
    // Chcemy by to było za pokojami, ale przed zdjÄ‚â€žĂ˘â€žËciem tła
    if (currentImage) {
        room.supplyGroup.moveTo(1);
    }
}

function clearSupplyPathData(room) {
    if (room.supplyGroup) {
        canvas.remove(room.supplyGroup);
        room.supplyGroup = null;
    }
    room.supplyPathPoints = null;
    room.supplyLengthPixels = 0;
    room.supplyLengthMeters = 0;
}

function clearSelectedRoomSupplyPath() {
    if (!selectedRoom) return;
    clearSupplyPathData(selectedRoom);
    recalculateRoom(selectedRoom);
}

// ==========================================
// 5. RYSOWANIE POMIESZCZEĂ„ąĂ‚Â I OBLICZENIA PĘTLI
// ==========================================
function startDrawingRoom() {
    if (pixelsPerMeter === 0) {
        alert('Najpierw przeprowadź kalibrację skali!');
        return;
    }
    
    if (currentState === State.DRAWING_ROOM) {
        stopDrawingRoom();
        return;
    }
    
    setTool(Tool.SELECT);
    currentState = State.DRAWING_ROOM;
    canvas.selection = false;
    currentRoomPoints = [];
    currentLines = [];
    
    drawRoomBtn.classList.add('active');
    drawRoomBtn.textContent = 'Zakończ rysowanie';
    canvas.defaultCursor = 'crosshair';
    deselectRoom();
}

function stopDrawingRoom() {
    currentState = State.IDLE;
    canvas.selection = (currentTool === Tool.SELECT);
    drawRoomBtn.classList.remove('active');
    drawRoomBtn.textContent = 'Rysuj Pomieszczenie';
    canvas.defaultCursor = (currentTool === Tool.PAN) ? 'grab' : 'default';
    
    currentLines.forEach(line => canvas.remove(line));
    currentLines = [];
    currentRoomPoints = [];
    
    const objects = canvas.getObjects();
    objects.forEach(obj => {
        if (obj.type === 'circle' && obj.fill === '#00ADB5') canvas.remove(obj);
    });
    
    canvas.renderAll();
}

function getOrtoCoordinates(e) {
    const pointer = canvas.getPointer(e);
    let snapX = pointer.x;
    let snapY = pointer.y;
    
    if (currentRoomPoints.length > 0 && !e.shiftKey) {
        const lastPoint = currentRoomPoints[currentRoomPoints.length - 1];
        const dx = Math.abs(pointer.x - lastPoint.x);
        const dy = Math.abs(pointer.y - lastPoint.y);
        
        if (dx < dy) {
            snapX = lastPoint.x;
        } else {
            snapY = lastPoint.y;
        }
    }
    return { snapX, snapY };
}

function addRoomPoint(e) {
    const { snapX, snapY } = getOrtoCoordinates(e);
    
    if (currentRoomPoints.length > 2) {
        const firstPoint = currentRoomPoints[0];
        const dist = Math.sqrt(Math.pow(snapX - firstPoint.x, 2) + Math.pow(snapY - firstPoint.y, 2)) * canvas.getZoom();
        if (dist < 18) {
            finishRoom();
            return;
        }
    }
    
    currentRoomPoints.push({ x: snapX, y: snapY });
    
    const circle = new fabric.Circle({
        radius: 4 / canvas.getZoom(),
        fill: '#00ADB5',
        stroke: '#ffffff',
        strokeWidth: 1 / canvas.getZoom(),
        left: snapX,
        top: snapY,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        opacity: 0.8
    });
    canvas.add(circle);
    
    if (currentLines.length > 0) {
        const lastLine = currentLines[currentLines.length - 1];
        lastLine.set({ strokeDashArray: null, x2: snapX, y2: snapY });
    }
}

function finishRoom() {
    currentLines.forEach(line => canvas.remove(line));
    currentLines = [];
    
    const objects = canvas.getObjects();
    objects.forEach(obj => {
        if (obj.type === 'circle' && obj.fill === '#00ADB5') canvas.remove(obj);
    });
    
    if (currentRoomPoints.length > 2) {
        const roomId = Date.now() + Math.floor(Math.random() * 1000);
        const polygon = new fabric.Polygon(currentRoomPoints, {
            fill: 'rgba(0, 173, 181, 0.3)',
            stroke: '#00ADB5',
            strokeWidth: 2 / canvas.getZoom(),
            selectable: true,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true
        });
        
        polygon._roomId = roomId;
        canvas.add(polygon);
        
        const defaultName = `Pomieszczenie ${rooms.length + 1}`;
        const room = {
            id: roomId,
            name: defaultName,
            heatingMode: 'heating',
            polygon: polygon,
            points: [...currentRoomPoints],
            pipeSpacing: 100,
            supplySpacing: 50,
            maxLoopLength: 100,
            customLoopCount: null
        };
        rooms.push(room);
        
        recalculateRoom(room);
        renderRoomsList();
        selectRoom(roomId);
        updateActionButtonsState();
    }
    
    stopDrawingRoom();
}

function calculatePolygonArea(points) {
    let area = 0;
    const j = points.length - 1;
    for (let i = 0; i < points.length; i++) {
        let prev = i === 0 ? j : i - 1;
        area += (points[prev].x + points[i].x) * (points[prev].y - points[i].y);
    }
    return Math.abs(area / 2.0);
}

function recalculateRoom(room) {
    if (pixelsPerMeter <= 0) return;
    
    room.heatingMode = room.heatingMode || 'heating';
    
    const areaPixels = calculatePolygonArea(room.points);
    room.areaM2 = areaPixels / (pixelsPerMeter * pixelsPerMeter);
    
    // Oblicz dystans magistrali w metrach (zasilanie + powrĂłt = x2)
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
        
        // Brak podziaĹ‚u na pÄ™tle
        if (room.loopGroup) {
            canvas.remove(room.loopGroup);
            room.loopGroup = null;
        }
    } else {
        // Standardowe ogrzewanie podĹ‚ogowe
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
        
        // Wizualizacja podziaĹ‚u pÄ™tli
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
        left: center.x,
        top: center.y,
        fontSize: room.textSize || Math.max(11, 15 / canvas.getZoom()),
        fill: textColor,
        fontWeight: 'bold',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        textBackgroundColor: 'rgba(255, 255, 255, 0.88)'
    });
    
    canvas.add(room.textObj);
    room.textObj.bringToFront();

    bringManifoldsToFront();
}

function bringManifoldsToFront() {
    if (typeof manifolds !== 'undefined') {
        manifolds.forEach(m => {
            if (m.group) m.group.bringToFront();
        });
    }
}

function updateAllLabelsFontSize() {
    const zoom = canvas.getZoom();
    rooms.forEach(room => {
        if (room.textObj) {
            room.textObj.set({
                fontSize: Math.max(10, 15 / zoom)
            });
        }
    });
    canvas.renderAll();
}

function getPolygonCenter(points) {
    let x = 0, y = 0;
    points.forEach(p => {
        x += p.x;
        y += p.y;
    });
    return { x: x / points.length, y: y / points.length };
}

function getRoomIndex(id) {
    return rooms.findIndex(r => r.id === id) + 1;
}

function recalculateAllRooms() {
    rooms.forEach(room => recalculateRoom(room));
    canvas.renderAll();
    renderRoomsList();
    updateActionButtonsState();
}

// ==========================================
// 6. ZESTAWIENIE I EDYCJA POMIESZCZEĂ„ąĂ‚Â
// ==========================================
function updateRoomPropertiesVisibility() {
    if (!selectedRoom) return;
    const mode = roomHeatingMode ? roomHeatingMode.value : (selectedRoom.heatingMode || 'heating');
    
    if (mode === 'transit') {
        if (roomHeatingParamsArea) roomHeatingParamsArea.classList.add('hidden');
        if (roomModeInfoArea) {
            roomModeInfoArea.className = 'room-mode-info transit-info';
            roomModeInfoArea.innerHTML = '<strong>Pomieszczenie tranzytowe</strong><br>Przez to pomieszczenie przechodzą rury dobiegowe/magistralne do innych pomieszczeń. Nie generuje ono własnych pętli podłogówki.';
            roomModeInfoArea.classList.remove('hidden');
        }
    } else if (mode === 'none') {
        if (roomHeatingParamsArea) roomHeatingParamsArea.classList.add('hidden');
        if (roomModeInfoArea) {
            roomModeInfoArea.className = 'room-mode-info none-info';
            roomModeInfoArea.innerHTML = '<strong>Brak ogrzewania</strong><br>Pomieszczenie wyłączone z bilansu podłogówki (np. spiżarnia, schowek). Powierzchnia jest mierzona, lecz nie są dobierane pętle grzewcze.';
            roomModeInfoArea.classList.remove('hidden');
        }
    } else {
        if (roomHeatingParamsArea) roomHeatingParamsArea.classList.remove('hidden');
        if (roomModeInfoArea) roomModeInfoArea.classList.add('hidden');
    }
}

function renderRoomsList() {
    roomsList.innerHTML = '';
    rooms.forEach((room) => {
        const li = document.createElement('li');
        const mode = room.heatingMode || 'heating';
        const isSelected = selectedRoom && selectedRoom.id === room.id;
        const modeClass = mode === 'transit' ? 'transit' : (mode === 'none' ? 'none' : '');
        li.className = `room-item ${isSelected ? 'selected' : ''} ${room.isError ? 'error' : ''} ${modeClass}`.trim();
        li.onclick = () => selectRoom(room.id);
        
        const title = room.name || `Pomieszczenie ${getRoomIndex(room.id)}`;
        let subtitleText = '';
        let badgeHtml = '';
        
        if (mode === 'transit') {
            subtitleText = `Pow.: ${room.areaM2 ? room.areaM2.toFixed(1) : '?'} m² | Tranzyt rur`;
            badgeHtml = `<span class="room-loops-badge transit">Tranzyt</span><br><small style="color: #aaa;">0 pętli</small>`;
        } else if (mode === 'none') {
            subtitleText = `Pow.: ${room.areaM2 ? room.areaM2.toFixed(1) : '?'} m² | Bez ogrzewania`;
            badgeHtml = `<span class="room-loops-badge none">Brak</span><br><small style="color: #aaa;">0 pętli</small>`;
        } else {
            const avgLength = room.loopCount ? (room.totalPipeLength / room.loopCount).toFixed(1) : '0';
            subtitleText = `Pow.: ${room.areaM2 ? room.areaM2.toFixed(1) : '?'} m² | Rozstaw: ${room.pipeSpacing}mm`;
            badgeHtml = `<span class="room-loops-badge">${room.loopCount || '?'} pętli</span><br><small style="color: #aaa;">~${avgLength}m / pętla</small>`;
        }
        
        li.innerHTML = `
            <div>
                <div class="room-title">${title}</div>
                <small style="color: #aaa;">${subtitleText}</small>
            </div>
            <div style="text-align: right;">
                ${badgeHtml}
            </div>
        `;
        roomsList.appendChild(li);
    });
}

function selectRoom(id) {
    if (currentState !== State.IDLE) return;
    
    deselectManifold();
    
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    
    selectedRoom = room;
    selectedRoom.heatingMode = selectedRoom.heatingMode || 'heating';
    roomPropertiesPanel.classList.remove('hidden');
    
    roomNameInput.value = selectedRoom.name || `Pomieszczenie ${getRoomIndex(selectedRoom.id)}`;
    roomTextSizeInput.value = selectedRoom.textSize || 15;
    if (roomHeatingMode) roomHeatingMode.value = selectedRoom.heatingMode;
    updateRoomPropertiesVisibility();
    
    roomPipeSpacing.value = selectedRoom.pipeSpacing;
    roomSupplySpacing.value = selectedRoom.supplySpacing || 50;
    roomMaxLoopLength.value = selectedRoom.maxLoopLength;
    roomLoopCount.value = selectedRoom.loopCount;
    populateRoomManifoldSelect(selectedRoom.manifoldId);
    
    if (selectedRoom.isError && selectedRoom.heatingMode === 'heating') {
        roomWarning.classList.remove('hidden');
    } else {
        roomWarning.classList.add('hidden');
    }
}

function deselectRoom() {
    selectedRoom = null;
    hideRoomProperties();
    recalculateAllRooms();
}

function hideRoomProperties() {
    if (roomPropertiesPanel) roomPropertiesPanel.classList.add('hidden');
}

function saveRoomProperties() {
    if (!selectedRoom) return;
    
    selectedRoom.name = roomNameInput.value;
    selectedRoom.textSize = parseInt(roomTextSizeInput.value) || 15;
    if (roomHeatingMode) selectedRoom.heatingMode = roomHeatingMode.value;
    updateRoomPropertiesVisibility();
    
    selectedRoom.pipeSpacing = parseInt(roomPipeSpacing.value) || 100;
    selectedRoom.supplySpacing = parseInt(roomSupplySpacing.value) || 50;
    selectedRoom.maxLoopLength = parseInt(roomMaxLoopLength.value) || 100;
    const customLoops = parseInt(roomLoopCount.value);
    selectedRoom.customLoopCount = customLoops > 0 ? customLoops : null;
    selectedRoom.manifoldId = roomManifoldSelect.value ? String(roomManifoldSelect.value) : null;
    
    recalculateRoom(selectedRoom);
    renderRoomsList();
    
    if (selectedRoom.supplyPathPoints) {
        renderSupplyPath(selectedRoom);
    }
    
    canvas.renderAll();
    
    if (selectedRoom.isError && selectedRoom.heatingMode === 'heating') {
        roomWarning.classList.remove('hidden');
    } else {
        roomWarning.classList.add('hidden');
    }
}

function deleteSelectedRoom() {
    if (!selectedRoom) return;
    
    if (confirm(`Czy na pewno chcesz usunąć "${selectedRoom.name || 'to pomieszczenie'}"?`)) {
        if (selectedRoom.polygon) canvas.remove(selectedRoom.polygon);
        if (selectedRoom.textObj) canvas.remove(selectedRoom.textObj);
        
        rooms = rooms.filter(r => r.id !== selectedRoom.id);
        selectedRoom = null;
        hideRoomProperties();
        recalculateAllRooms();
        canvas.renderAll();
    }
}

// ==========================================
// 7. GENEROWANIE RAPORTU, TABELA PĘTLI, PDF I DRUK
// ==========================================
function getFullCanvasSnapshot() {
    if (!canvas || !currentImage) return '';
    
    const prevVpt = [...canvas.viewportTransform];
    const prevZoom = canvas.getZoom();
    const prevWidth = canvas.getWidth();
    const prevHeight = canvas.getHeight();
    
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.setZoom(1);
    canvas.setWidth(currentImage.width);
    canvas.setHeight(currentImage.height);
    
    rooms.forEach(room => {
        if (room.textObj) {
            room.textObj.set({ fontSize: 16 });
        }
    });
    
    canvas.renderAll();
    
    const dataURL = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.95
    });
    
    canvas.setWidth(prevWidth);
    canvas.setHeight(prevHeight);
    canvas.setViewportTransform(prevVpt);
    canvas.setZoom(prevZoom);
    updateAllLabelsFontSize();
    canvas.renderAll();
    
    return dataURL;
}

function generateReportData() {
    projectLevels[currentLevelIndex].state = captureCurrentLevelState();

    let totalArea = 0;
    let heatedArea = 0;
    let totalLoops = 0;
    let totalNetPipes = 0;
    let hasError = false;

    const manifoldStats = {};
    const roomsData = [];
    
    projectLevels.forEach((level) => {
        const state = level.state;
        if (!state) return;
        
        if (state.manifolds) {
            state.manifolds.forEach(m => {
                const cap = parseInt(m.loopCount) || 5;
                const uniqueId = level.name + '_' + m.id;
                manifoldStats[uniqueId] = {
                    id: uniqueId,
                    name: `${level.name} - ${m.name || 'Rozdzielacz'}`,
                    loopCount: cap,
                    connectedLoops: 0,
                    rooms: []
                };
            });
        }
        
        if (state.rooms) {
            state.rooms.forEach((room, idx) => {
                const mode = room.heatingMode || 'heating';
                const isHeating = mode === 'heating';
                const roomArea = room.areaM2 || 0;
                
                totalArea += roomArea;
                
                let assignedManifoldName = null;
                
                if (isHeating) {
                    heatedArea += roomArea;
                    totalLoops += room.loopCount || 0;
                    totalNetPipes += room.totalPipeLength || 0;
                    if (room.isError) hasError = true;

                    if (room.manifoldId) {
                        const uniqueManifoldId = level.name + '_' + room.manifoldId;
                        if (manifoldStats[uniqueManifoldId]) {
                            manifoldStats[uniqueManifoldId].connectedLoops += (room.loopCount || 0);
                            manifoldStats[uniqueManifoldId].rooms.push(`${level.name} - ${room.name || `Pom. ${idx + 1}`}`);
                            assignedManifoldName = manifoldStats[uniqueManifoldId].name;
                        }
                    }
                }
        
                const avgLoopLength = (isHeating && room.loopCount > 0) ? (room.totalPipeLength / room.loopCount) : 0;
                
                const loopDetails = [];
                if (isHeating) {
                    for (let i = 1; i <= room.loopCount; i++) {
                        loopDetails.push({
                            index: `${level.name.split(' ').pop()}.${idx + 1}.${i}`,
                            length: avgLoopLength.toFixed(1),
                            isOverMax: avgLoopLength > room.maxLoopLength
                        });
                    }
                }
                
                roomsData.push({
                    index: roomsData.length + 1,
                    name: `${level.name} - ${room.name || `Pom. ${idx + 1}`}`,
                    heatingMode: mode,
                    manifoldName: assignedManifoldName,
                    areaM2: roomArea.toFixed(2),
                    supplyLength: ((room.supplyLengthPixels || 0) / (state.pixelsPerMeter || pixelsPerMeter || 1) * 2).toFixed(1),
                    pipeSpacing: isHeating ? room.pipeSpacing : null,
                    loopCount: isHeating ? room.loopCount : 0,
                    totalPipeLength: isHeating ? (room.totalPipeLength || 0).toFixed(1) : '0.0',
                    avgLoopLength: isHeating ? avgLoopLength.toFixed(1) : '0.0',
                    maxLoopLength: room.maxLoopLength,
                    loopDetails: loopDetails,
                    isError: isHeating ? room.isError : false
                });
            });
        }
    });
    
    const manifoldsData = Object.values(manifoldStats).map(m => {
        return {
            id: m.id,
            name: m.name,
            loopCount: m.loopCount,
            connectedLoops: m.connectedLoops,
            isOverloaded: m.connectedLoops > m.loopCount,
            rooms: m.rooms
        };
    });

    const totalGrossPipes = totalNetPipes * 1.10;
    const manifoldsCount = manifoldsData.length;
    let manifoldsVal = '';
    let manifoldsLbl = '';

    if (manifoldsCount === 0) {
        manifoldsVal = '0 szt.';
        manifoldsLbl = totalLoops > 0 ? `Brak na rzucie (wymagane: ${totalLoops} ob.)` : 'Rozdzielacze na rysunku';
    } else if (manifoldsCount === 1) {
        const m = manifoldsData[0];
        manifoldsVal = `1 szt. (${m.loopCount} pętli)`;
        manifoldsLbl = `${m.name} (${m.connectedLoops}/${m.loopCount} podł.)`;
    } else if (manifoldsCount === 2) {
        const m1 = manifoldsData[0];
        const m2 = manifoldsData[1];
        manifoldsVal = `2 szt. (${m1.loopCount} i ${m2.loopCount} p.)`;
        manifoldsLbl = `Rozdzielacze (łącznie ${m1.loopCount + m2.loopCount} p.)`;
    } else {
        const totalCap = manifoldsData.reduce((sum, m) => sum + m.loopCount, 0);
        const sizesStr = manifoldsData.map(m => `${m.loopCount}p.`).join(' + ');
        manifoldsVal = `${manifoldsCount} szt. (${sizesStr})`;
        manifoldsLbl = `Rozdzielacze (łącznie ${totalCap} p.)`;
    }
    
    return {
        projectName: currentProjectName || 'Projekt Ogrzewania Podłogowego',
        installationLocation: currentProjectLocation || '',
        date: new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        hasError: hasError,
        summary: {
            totalArea: totalArea.toFixed(1),
            heatedArea: heatedArea.toFixed(1),
            totalLoops: totalLoops,
            totalNetPipes: Math.round(totalNetPipes),
            totalGrossPipes: Math.round(totalGrossPipes),
            manifoldsCount: manifoldsCount,
            manifoldsVal: manifoldsVal,
            manifoldsLbl: manifoldsLbl
        },
        manifolds: manifoldsData,
        rooms: roomsData
    };
}

function buildReportHTML(reportData, snapshots) {
    const tableRows = reportData.rooms.map(r => {
        let loopChips = '';
        let statusHtml = '';
        let spacingCol = '';
        let loopCountCol = '';
        let totalPipeCol = '';
        let avgLoopCol = '';
        let rowClass = '';
        
        if (r.heatingMode === 'transit') {
            loopChips = `<span class="loop-chip transit-chip">Tranzyt rur</span>`;
            statusHtml = `<span class="badge badge-transit">Tranzyt</span>`;
            spacingCol = `<span style="color:#888;">-</span>`;
            loopCountCol = `<span style="color:#b45309; font-weight:600;">0 (Tranzyt)</span>`;
            totalPipeCol = `<span style="color:#888;">-</span>`;
            avgLoopCol = `<span style="color:#888;">-</span>`;
        } else if (r.heatingMode === 'none') {
            loopChips = `<span class="loop-chip none-chip">Brak podłogówki</span>`;
            statusHtml = `<span class="badge badge-neutral">Bez ogrz.</span>`;
            spacingCol = `<span style="color:#888;">-</span>`;
            loopCountCol = `<span style="color:#888;">0</span>`;
            totalPipeCol = `<span style="color:#888;">-</span>`;
            avgLoopCol = `<span style="color:#888;">-</span>`;
        } else {
            loopChips = r.loopDetails.map(l => 
                `<span class="loop-chip ${l.isOverMax ? 'warn' : ''}">Pętla ${l.index}: ${l.length}m</span>`
            ).join('');
            
            statusHtml = r.isError 
                ? `<span class="badge badge-warn">Przekroczono<br><small style="font-size: 8.5px; font-weight: normal;">${r.avgLoopLength}m &gt; ${r.maxLoopLength}m</small></span>`
                : `<span class="badge badge-ok">OK</span>`;
            spacingCol = `${r.pipeSpacing} mm`;
            loopCountCol = `<strong>${r.loopCount}</strong>`;
            totalPipeCol = `${r.totalPipeLength} mb`;
            avgLoopCol = `~${r.avgLoopLength} mb`;
            if (r.isError) rowClass = 'row-warn';
        }
            
        return `
            <tr class="${rowClass}">
                <td style="text-align: center; font-weight: bold;">${r.index}</td>
                <td>
                    <strong>${r.name}</strong>
                    ${r.manifoldName ? `<br><span class="room-manifold-tag">${r.manifoldName}</span>` : ''}
                    ${r.supplyLength > 0 ? `<br><small style="color:#666;">+ Magistrala: ${r.supplyLength} mb</small>` : ''}
                </td>
                <td style="text-align: right;">${r.areaM2} m²</td>
                <td style="text-align: center;">${spacingCol}</td>
                <td style="text-align: center;">${loopCountCol}</td>
                <td style="text-align: right; font-weight: 600;">${totalPipeCol}</td>
                <td style="text-align: right;">${avgLoopCol}</td>
                <td><div class="loops-tag-list">${loopChips}</div></td>
                <td style="text-align: center;">${statusHtml}</td>
            </tr>
        `;
    }).join('');
    
    const areaSummaryText = reportData.summary.totalArea !== reportData.summary.heatedArea 
        ? `<div class="summary-val">${reportData.summary.heatedArea} m²</div><div class="summary-lbl">Powierzchnia ogrzewana<br><small style="color:#888;">(z ${reportData.summary.totalArea} m² całk.)</small></div>`
        : `<div class="summary-val">${reportData.summary.totalArea} m²</div><div class="summary-lbl">Powierzchnia ogrzewana</div>`;

    // Funkcja zwraca obiekt z osobnym HTML-em dla każdej strony raportu
    // oraz połączony HTML do podglądu na ekranie
    const reportHeader = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 2px solid #0f172a; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 12px; background-color: #ea580c; display: flex; align-items: center; justify-content: center; padding: 6px;">
                    <svg style="width: 100%; height: 100%;" viewBox="0 0 100 100" fill="none">
                        <path d="M22,64 A36,36 0 1,1 76,77" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" />
                        <path d="M42,30 A20,20 0 0,1 70,58" fill="none" stroke="#e0e7ff" stroke-width="7.5" stroke-linecap="round" />
                        <circle cx="50" cy="50" r="4" fill="#ffffff" />
                    </svg>
                </div>
                <div style="line-height: 1.2;">
                    <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.025em; color: #0f172a; font-family: 'Outfit', sans-serif;">LeSa <span style="color: #ea580c;">HOME</span></span>
                    <span style="display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-family: 'Plus Jakarta Sans', sans-serif;">Nowoczesne Systemy Grzewcze &bull; Instalacje HVAC</span>
                </div>
            </div>

                <p class="report-subtitle">System Projektowania i Kalkulacji Ogrzewania Podłogowego</p>
            </div>
            <div style="text-align: right; font-size: 11px; color: #475569; line-height: 1.4; font-family: 'Plus Jakarta Sans', sans-serif;">
                <div>Projekt: <strong style="color: #0f172a;">${reportData.projectName}</strong></div>
                ${reportData.installationLocation ? `<div>Miejsce: <strong style="color: #0f172a;">${reportData.installationLocation}</strong></div>` : ''}
                <div>Data: <strong style="color: #0f172a;">${reportData.date}</strong></div>
                <p><strong>Status projektu:</strong> ${reportData.hasError ? '<span class="badge badge-warn">Wymaga korekty pętli</span>' : '<span class="badge badge-ok">Poprawny (OK)</span>'}</p>
            </div>
        </div>
        <div style="text-align: center; margin: 16px 0;">
            <h1 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.025em; color: #0f172a; margin: 0; font-family: 'Outfit', sans-serif;">
              Zestawienie Pętli i Raport Projektu
            </h1>
        </div>`;

    const manifoldsBlock = reportData.manifolds.length > 0 ? `
        <div class="report-manifolds-section">
            <div class="report-manifolds-heading">
                <strong>Rozdzielacze wprowadzone do rysunku (${reportData.manifolds.length} szt.):</strong>
            </div>
            <div class="report-manifolds-grid">
                ${reportData.manifolds.map(m => `
                    <div class="report-manifold-card ${m.isOverloaded ? 'overloaded' : ''}">
                        <div class="man-card-header">
                            <span class="man-card-title">${m.name}</span>
                            <span class="man-card-badge">Wielkość: <strong>${m.loopCount} pętli</strong></span>
                        </div>
                        <div class="man-card-body">
                            <div>Obiegi: <strong>${m.connectedLoops} podłączonych</strong> / ${m.loopCount} sekcji
                                ${m.isOverloaded ? `<span class="badge badge-warn" style="margin-left: 6px;">Przekroczona pojemność!</span>` : ''}
                            </div>
                            ${m.rooms.length > 0 
                                ? `<div class="man-card-rooms">Pomieszczenia: ${m.rooms.join(', ')}</div>`
                                : `<div class="man-card-rooms" style="color:#94a3b8;">Brak przypisanych pomieszczeń</div>`
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>` : (reportData.summary.totalLoops > 0 ? `
        <div class="report-manifolds-section empty-notice">
            <span style="color: #64748b;">Na rysunku nie wstawiono jeszcze rozdzielacza (wymagane min. ${reportData.summary.totalLoops} pętli).</span>
        </div>` : '');

    const page1 = `
        ${reportHeader}
        <div class="report-section">
            <h3>1. Zestawienie Zbiorcze i Zapotrzebowanie Materiałowe</h3>
            <div class="summary-cards-grid">
                <div class="summary-card">
                    ${areaSummaryText}
                </div>
                <div class="summary-card">
                    <div class="summary-val">${reportData.summary.totalLoops}</div>
                    <div class="summary-lbl">Liczba obiegów (pętli)</div>
                </div>
                <div class="summary-card">
                    <div class="summary-val">${reportData.summary.totalNetPipes} mb</div>
                    <div class="summary-lbl">Rura w pętlach (netto)</div>
                </div>
                <div class="summary-card highlight">
                    <div class="summary-val">${reportData.summary.totalGrossPipes} mb</div>
                    <div class="summary-lbl">Zapotrzebowanie rury (+10% zapas)</div>
                </div>
                <div class="summary-card">
                    <div class="summary-val">${reportData.summary.manifoldsVal}</div>
                    <div class="summary-lbl">${reportData.summary.manifoldsLbl}</div>
                </div>
            </div>
            ${manifoldsBlock}
        </div>`;

    const pageSubhead = (pageNum, label) => `
        <div class="report-page-subhead">
            <span>Projekt: <strong>${reportData.projectName}</strong>${reportData.installationLocation ? ` &bull; ${reportData.installationLocation}` : ''}</span>
            <span class="page-tag">Strona ${pageNum} &bull; ${label}</span>
        </div>`;

    const page2 = `
        ${pageSubhead(2, 'Wykaz Pętli')}
        <div class="report-section">
            <h3>2. Szczegółowy Wykaz Pętli w Pomieszczeniach</h3>
            <div class="table-responsive">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th style="width: 5%; text-align: center;">Nr</th>
                            <th style="width: 21%;">Pomieszczenie</th>
                            <th style="width: 10%; text-align: right;">Powierzchnia</th>
                            <th style="width: 8%; text-align: center;">Rozstaw</th>
                            <th style="width: 7%; text-align: center;">Pętle</th>
                            <th style="width: 10%; text-align: right;">Dł. rury</th>
                            <th style="width: 9%; text-align: right;">Śr. pętla</th>
                            <th style="width: 18%;">Wykaz pętli</th>
                            <th style="width: 12%; text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>`;
    let imagePagesHTML = '';
    let imagePagesArray = [];
    if (snapshots && snapshots.length > 0) {
        snapshots.forEach((snap, idx) => {
            const pageNum = 3 + idx;
            const pHTML = `
            ${pageSubhead(pageNum, 'Rzut Graficzny - ' + snap.name)}
            <div class="report-section">
                <h3>${pageNum}. Rzut Graficzny Rozmieszczenia - ${snap.name}</h3>
                <div class="report-plan-container">
                    <img src="${snap.url}" alt="Rzut instalacji - ${snap.name}">
                </div>
            </div>
            <div class="report-footer">
                <p>Wygenerowano automatycznie w aplikacji <strong>LeSa-CAD</strong>. Wszelkie prawa zastrzeżone.</p>
            </div>`;
            imagePagesArray.push(pHTML);
            imagePagesHTML += `<div class="report-page">${pHTML}</div>`;
        });
    }

    const footer = `<div class="report-footer"><p>Wygenerowano automatycznie w aplikacji <strong>LeSa-CAD</strong>. Wszelkie prawa zastrzeżone.</p></div>`;

    const previewHTML = `
        <div class="report-page">${page1}</div>
        <div class="report-page">${page2}</div>
        ${imagePagesHTML}
    `;

    return {
        previewHTML: previewHTML,
        pages: [page1, page2, ...imagePagesArray].filter(Boolean),
        footer: footer
    };
}

function openReportModal() {
    projectLevels[currentLevelIndex].state = captureCurrentLevelState();
    const hasAnyRooms = projectLevels.some(l => l.state && l.state.rooms && l.state.rooms.length > 0);
    if (!hasAnyRooms) {
        alert('Dodaj co najmniej jedno pomieszczenie, aby wygenerować raport.');
        return;
    }
    
    const reportData = generateReportData();
    const snapshots = projectLevels.filter(l => l.state && l.state.snapshotUrl).map(l => ({ name: l.name, url: l.state.snapshotUrl }));
    const result = buildReportHTML(reportData, snapshots);
    
    reportPaper.innerHTML = result.previewHTML;
    reportModal.classList.remove('hidden');
    
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTop = 0;
}

function closeReportModal() {
    reportModal.classList.add('hidden');
}

async function exportToPDF() {
    projectLevels[currentLevelIndex].state = captureCurrentLevelState();
    const hasAnyRooms = projectLevels.some(l => l.state && l.state.rooms && l.state.rooms.length > 0);
    if (!hasAnyRooms) {
        alert('Dodaj co najmniej jedno pomieszczenie przed eksportem do PDF.');
        return;
    }
    
    const reportData = generateReportData();
    const snapshots = projectLevels.filter(l => l.state && l.state.snapshotUrl).map(l => ({ name: l.name, url: l.state.snapshotUrl }));
    const result = buildReportHTML(reportData, snapshots);
    const pages = result.pages;
    
    const cleanProjName = (currentProjectName || 'Raport').replace(/[^a-zA-Z0-9ąćÄ‚â€žĂ˘â€žËłńóśźżÄ‚â€žĂ˘â‚¬ĹľÄ‚â€žĂ˘â‚¬Â Ä‚â€žĂ‚ÂĂ„ąĂ‚ÂĂ„ąĂ‚ÂÓŚŹŻ_-]/g, '_').substring(0, 30);
    const filename = `LeSa_CAD_${cleanProjName}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // A4 w mm: 210 x 297, margines 10mm => obszar roboczy 190 x 277
    const marginMM = 10;
    const pageWidthMM = 210;
    const pageHeightMM = 297;
    const contentWidthMM = pageWidthMM - 2 * marginMM;  // 190mm
    const contentHeightMM = pageHeightMM - 2 * marginMM; // 277mm

    // Tymczasowy kontener renderowany poza ekranem
    const tempContainer = document.createElement('div');
    tempContainer.className = 'report-paper pdf-export-mode';
    tempContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 720px;
        max-width: 720px;
        background: #ffffff;
        color: #222222;
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        padding: 30px 35px;
        box-sizing: border-box;
    `;
    document.body.appendChild(tempContainer);

    try {
        const pdf = new jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const scale = 2;

        for (let i = 0; i < pages.length; i++) {
            tempContainer.innerHTML = pages[i];

            // Poczekaj, aż obrazki siÄ‚â€žĂ˘â€žË załadują (ważne dla strony 3 z rzutem)
            const images = tempContainer.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            const canvas = await html2canvas(tempContainer, {
                scale: scale,
                useCORS: true,
                logging: false,
                letterRendering: true,
                backgroundColor: '#ffffff',
                width: tempContainer.scrollWidth,
                height: tempContainer.scrollHeight,
                scrollX: 0,
                scrollY: 0
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            // Oblicz wymiary: dopasuj szerokość do obszaru roboczego, zachowaj proporcje
            const imgWidthPx = canvas.width;
            const imgHeightPx = canvas.height;

            const imgAspect = imgHeightPx / imgWidthPx;
            const fitWidth = contentWidthMM;
            const fitHeight = fitWidth * imgAspect;

            if (i > 0) pdf.addPage();

            // Jeśli strona jest wyższa niż obszar roboczy A4, przeskaluj aby siÄ‚â€žĂ˘â€žË zmieściła
            if (fitHeight > contentHeightMM) {
                const scaledHeight = contentHeightMM;
                const scaledWidth = scaledHeight / imgAspect;
                const offsetX = marginMM + (contentWidthMM - scaledWidth) / 2;
                pdf.addImage(imgData, 'JPEG', offsetX, marginMM, scaledWidth, scaledHeight);
            } else {
                pdf.addImage(imgData, 'JPEG', marginMM, marginMM, fitWidth, fitHeight);
            }
        }

        pdf.save(filename);
    } catch (err) {
        console.error('Błąd eksportu PDF:', err);
        alert('Wystąpił błąd podczas generowania pliku PDF.');
    } finally {
        document.body.removeChild(tempContainer);
    }
}

function printReport() {
    projectLevels[currentLevelIndex].state = captureCurrentLevelState();
    const hasAnyRooms = projectLevels.some(l => l.state && l.state.rooms && l.state.rooms.length > 0);
    if (!hasAnyRooms) {
        alert('Dodaj co najmniej jedno pomieszczenie przed wydrukiem.');
        return;
    }
    
    const reportData = generateReportData();
    const snapshots = projectLevels.filter(l => l.state && l.state.snapshotUrl).map(l => ({ name: l.name, url: l.state.snapshotUrl }));
    const result = buildReportHTML(reportData, snapshots);
    
    printContainer.innerHTML = `<div class="report-paper">${result.previewHTML}</div>`;
    
    window.print();
}



// --- Integracja Ofert ---
async function generateOfferData() {
    const reportData = generateReportData();
    
    // Save to CRM if active project exists
    const urlParams = new URLSearchParams(window.location.search);
    const activeProjectId = urlParams.get('projectId') || localStorage.getItem('lesa_active_project_id');
    if (activeProjectId) {
        try {
            let projects = [];
            if (window.ApiService) {
                projects = await ApiService.getProjects();
            } else {
                projects = JSON.parse(localStorage.getItem('lesa_projects')) || [];
            }
            const projectIndex = projects.findIndex(p => p.id === activeProjectId);
            if (projectIndex !== -1) {
                let proj = projects[projectIndex];
                proj.cadData = {
                    area: reportData.summary.heatedArea,
                    loopsCount: reportData.summary.totalLoops,
                    pipeLength: reportData.summary.totalNetPipes,
                    manifolds: reportData.summary.manifoldsCount,
                      rooms: reportData.rooms
                };
                // Also update the name/location if the user changed them here
                proj.clientName = currentProjectName;
                proj.clientAddress = currentProjectLocation;
                
                if (window.ApiService) {
                    await ApiService.saveProject(proj);
                } else {
                    localStorage.setItem('lesa_projects', JSON.stringify(projects));
                }
            }
        } catch (e) {
            console.error('CRM save error:', e);
        }
    }

    const offerData = {
        project: reportData.projectName,
        location: reportData.installationLocation,
        rooms: reportData.rooms,
        manifolds: reportData.manifolds,
        totalArea: reportData.summary.heatedArea,
        totalPipeNet: reportData.summary.totalNetPipes,
        totalPipeGross: parseFloat(reportData.summary.totalGrossPipes)
    };
    localStorage.setItem('lesa_cad_offer_data', JSON.stringify(offerData));
    
    const url = '../oferta.html' + (activeProjectId ? '?projectId=' + encodeURIComponent(activeProjectId) : '');
    window.open(url, '_blank');
}

// ==========================================
// MULTI-LEVEL SUPPORT
// ==========================================
let projectLevels = [ { id: Date.now(), name: "Poziom 1", state: null } ];
let currentLevelIndex = 0;

function captureCurrentLevelState() {
    try {
        let bgImage = null;
        if (currentImage) {
            bgImage = {
                dataUrl: currentImageDataUrl || (currentImage.toDataURL ? currentImage.toDataURL({ format: 'png' }) : null),
                width: currentImage.width,
                height: currentImage.height
            };
        }
        
        return {
            format: 'LeSa-CAD-s1c',
            projectName: currentProjectName,
            installationLocation: currentProjectLocation,
            pixelsPerMeter: pixelsPerMeter,
            scaleInfoText: scaleInfo ? scaleInfo.textContent : '',
            snapshotUrl: getFullCanvasSnapshot(),
            backgroundImage: bgImage,
            manifolds: manifolds.map(m => ({
                id: m.id, name: m.name, x: m.group ? m.group.left : 0, y: m.group ? m.group.top : 0,
                loopCount: m.loopCount, rotation: m.rotation
            })),
            rooms: rooms.map(r => ({
                id: r.id, name: r.name, heatingMode: r.heatingMode || 'heating',
                points: r.points, pipeSpacing: r.pipeSpacing, supplySpacing: r.supplySpacing,
                maxLoopLength: r.maxLoopLength, customLoopCount: r.customLoopCount, textSize: r.textSize,
                areaM2: r.areaM2, manifoldId: r.manifoldId, supplyPathPoints: r.supplyPathPoints,
                supplyLengthPixels: r.supplyLengthPixels, totalPipeLength: r.totalPipeLength,
                loopCount: r.loopCount, isError: r.isError
            }))
        };
    } catch (e) {
        console.error("Błąd w captureCurrentLevelState:", e);
        alert("Błąd podczas zapisywania stanu poziomu: " + e.message);
        return null;
    }
}

function switchLevel(index) {
    if (index === currentLevelIndex) return;
    
    if (currentLevelIndex >= 0 && currentLevelIndex < projectLevels.length) {
        projectLevels[currentLevelIndex].state = captureCurrentLevelState();
    }
    currentLevelIndex = index;
    const newState = projectLevels[currentLevelIndex].state;
    
    if (newState) {
        loadSingleLevelState(newState);
    } else {
        canvas.clear();
        currentImage = null;
        currentImageDataUrl = null;
        pixelsPerMeter = 0;
        if (scaleInfo) scaleInfo.textContent = 'Skala: Nieustawiona';
        rooms = [];
        manifolds = [];
        selectedRoom = null;
        if (typeof renderRoomsList === 'function') renderRoomsList();
        if (typeof renderManifoldsList === 'function') renderManifoldsList();
        if (typeof hideRoomProperties === 'function') hideRoomProperties();
        if (typeof updateActionButtonsState === 'function') updateActionButtonsState();
        if (typeof populateRoomManifoldSelect === 'function') populateRoomManifoldSelect();
    }
    
    updateLevelTabsUI();
}

function updateLevelTabsUI() {
    const container = document.getElementById('levels-container');
    if (!container) return;
    
    container.innerHTML = '';
    projectLevels.forEach((level, idx) => {
        const btn = document.createElement('button');
        btn.className = 'level-tab' + (idx === currentLevelIndex ? ' active' : '');
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = level.name;
        titleSpan.onclick = () => switchLevel(idx);
        btn.appendChild(titleSpan);
        
        if (projectLevels.length > 1) {
            const delSpan = document.createElement('span');
            delSpan.innerHTML = '&times;';
            delSpan.style.marginLeft = '8px';
            delSpan.style.color = '#ef4444';
            delSpan.style.fontWeight = 'bold';
            delSpan.title = 'Usuń ten poziom';
            delSpan.onclick = (e) => {
                e.stopPropagation();
                deleteLevel(idx);
            };
            btn.appendChild(delSpan);
        }
        
        container.appendChild(btn);
    });
}

function deleteLevel(idx) {
    if (projectLevels.length <= 1) return;
    if (!confirm(`Czy na pewno usunąć poziom "${projectLevels[idx].name}"? Cała praca na tej karcie przepadnie.`)) return;
    
    projectLevels.splice(idx, 1);
    
    if (currentLevelIndex === idx) {
        currentLevelIndex = -1;
        switchLevel(Math.max(0, idx - 1));
    } else {
        if (currentLevelIndex > idx) currentLevelIndex--;
        updateLevelTabsUI();
    }
}

function addNewLevel() {
    console.log("Dodawanie nowego poziomu...");
    const state = captureCurrentLevelState();
    if (state) {
        projectLevels[currentLevelIndex].state = state;
    }
    const newIdx = projectLevels.length;
    projectLevels.push({
        id: Date.now(),
        name: `Poziom ${newIdx + 1}`,
        state: null
    });
    updateLevelTabsUI();
    switchLevel(newIdx);
}

function getCombinedReportData() {
    projectLevels[currentLevelIndex].state = captureCurrentLevelState();
    
    let combinedRooms = [];
    let combinedManifolds = [];
    let totalArea = 0;
    let totalLoops = 0;
    let totalNetPipes = 0;
    let manifoldsCount = 0;
    
    projectLevels.forEach((level) => {
        const state = level.state;
        if (!state || !state.rooms) return;
        
        state.rooms.forEach(r => {
            const isHeating = r.heatingMode === 'heating';
            if (isHeating) {
                totalArea += r.areaM2 || 0;
                totalLoops += r.loopCount || 0;
                totalNetPipes += r.totalPipeLength || 0;
            }
            
            let rName = r.name || `Pom. ${r.id}`;
            let assignedManifoldName = 'Rozdzielacz 1'; // Default
            if (r.manifoldId && state.manifolds) {
                const man = state.manifolds.find(m => String(m.id) === String(r.manifoldId));
                if (man) {
                    assignedManifoldName = projectLevels.length > 1 ? `${level.name} - ${man.name || 'Rozdzielacz'}` : (man.name || 'Rozdzielacz');
                }
            }
            
            combinedRooms.push({
                name: projectLevels.length > 1 ? `${level.name} - ${rName}` : rName,
                manifoldName: assignedManifoldName,
                areaM2: r.areaM2 ? parseFloat(r.areaM2).toFixed(2) : '0.00',
                totalPipeLength: isHeating ? (r.totalPipeLength || 0).toFixed(1) : '0.0',
                heatingMode: r.heatingMode,
                loopCount: isHeating ? r.loopCount : 0
            });
        });
        
        if (state.manifolds) {
            state.manifolds.forEach(m => {
                manifoldsCount++;
                combinedManifolds.push({
                    name: `${level.name} - ${m.name || 'Rozdzielacz'}`,
                    connectedLoops: m.loopCount 
                });
            });
        }
    });
    
    const totalGrossPipes = totalNetPipes * 1.10;
    
    return {
        project: currentProjectName,
        location: currentProjectLocation,
        rooms: combinedRooms,
        manifolds: combinedManifolds,
        totalArea: totalArea.toFixed(1),
        totalPipeNet: Math.round(totalNetPipes),
        totalPipeGross: Math.round(totalGrossPipes)
    };
}

async function mergeOffersAndRedirect() {
    await saveProjectS1C(); // Zapis całego projektu (wszystkich poziomów) do bazy SQL jako JSON
    
    const combinedData = getCombinedReportData();
    localStorage.setItem('lesa_cad_offer_data', JSON.stringify(combinedData));
    
    const urlParams = new URLSearchParams(window.location.search);
    const activeProjectId = urlParams.get('projectId') || localStorage.getItem('lesa_active_project_id');
    
    if (activeProjectId) {
        try {
            let projects = [];
            if (window.ApiService) {
                projects = await ApiService.getProjects();
            } else {
                projects = JSON.parse(localStorage.getItem('lesa_projects')) || [];
            }
            const projectIndex = projects.findIndex(p => p.id === activeProjectId);
            if (projectIndex !== -1) {
                let proj = projects[projectIndex];
                proj.cadData = {
                    area: parseFloat(combinedData.totalArea),
                    loopsCount: combinedData.rooms.reduce((acc, r) => acc + (r.loopCount || 0), 0),
                    pipeLength: combinedData.totalPipeNet,
                    manifolds: combinedData.manifolds.length,
                    rooms: combinedData.rooms
                };
                proj.clientName = currentProjectName;
                proj.clientAddress = currentProjectLocation;
                
                if (window.ApiService) {
                    await ApiService.saveProject(proj);
                } else {
                    localStorage.setItem('lesa_projects', JSON.stringify(projects));
                }
            }
        } catch (e) {
            console.error('CRM metadata save error:', e);
        }
    }
    
    const url = '../oferta.html' + (activeProjectId ? '?projectId=' + encodeURIComponent(activeProjectId) : '');
    window.open(url, '_blank');
}

// Inject initialization
updateLevelTabsUI();





