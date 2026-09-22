const fs = require('fs');
let text = fs.readFileSync('lesa-cad-v2/app.js', 'utf8');

const brokenTarget = `// Inicjalizacja po załadowaniu okna
window.onload = async function() {
    initCanvas();
        height: 600,
        selection: false,
        fireRightClick: true,
        stopContextMenu: true,
    });`;

const properText = `// Inicjalizacja po załadowaniu okna
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
    });`;

// Because of weird encoding issue with "załadowaniu", let's use regex to match the window.onload part
const regex = /window\.onload = async function\(\) \{\s*initCanvas\(\);\s*height: 600,\s*selection: false,\s*fireRightClick: true,\s*stopContextMenu: true,\s*\}\);/g;

text = text.replace(regex, properText.substring(properText.indexOf('window.onload')));
fs.writeFileSync('lesa-cad-v2/app.js', text, 'utf8');
console.log('Fixed');
