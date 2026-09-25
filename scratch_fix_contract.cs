using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

public class FixContractGen {
    public static void Main() {
        string path = @"c:\LeSa.start\js\contract-generator.js";
        string text = File.ReadAllText(path, Encoding.UTF8);
        
        string oldContent = @"  async loadActiveProjectData\(\) \{[\s\S]*?this\.data\.dateEnd = formattedEnd;\s+\},";
        string newContent = @"  setDefaultDatesAndNumbers() {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    const end = new Date(today);
    end.setDate(today.getDate() + 14);
    const start = new Date(today);
    start.setDate(today.getDate() + 7);
    this.data.contractNo = `UM/LES/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/01`;
    this.data.contractDate = formattedToday;
    this.data.dateStart = start.toISOString().split('T')[0];
    this.data.dateEnd = end.toISOString().split('T')[0];
  },
  async loadActiveProjectData(projectId = null) {
    const activeProjectId = projectId || new URLSearchParams(window.location.search).get('projectId') || localStorage.getItem('lesa_active_project_id');
    if (activeProjectId) {
      try {
        let projects = [];
        if (window.ApiService) { projects = await ApiService.getProjects(); } else { projects = JSON.parse(localStorage.getItem('lesa_projects')) || []; }
        const project = projects.find(p => p.id === activeProjectId);
        if (project) {
          this.data.clientName = project.clientName || '';
          this.data.clientAddress = project.clientAddress || '';
          this.data.investmentAddress = project.investmentAddress || project.clientAddress || '';
          if (project.cadData) {
              if (project.cadData.area) this.data.area = project.cadData.area;
              if (project.cadData.loops) this.data.loops = project.cadData.loops;
              if (project.cadData.pipeLen) this.data.pipeLen = project.cadData.pipeLen;
          }
        }
      } catch (e) { console.error('Error loading project:', e); }
    }
  },
  async initDbProjectSelector() {
    const select = document.getElementById('db-project-select');
    const btnLoad = document.getElementById('btn-load-db-project');
    if (!select || !btnLoad) return;
    try {
        let projects = [];
        if (window.ApiService) { projects = await ApiService.getProjects(); } else { projects = JSON.parse(localStorage.getItem('lesa_projects')) || []; }
        select.innerHTML = '<option value="""">-- Wybierz projekt z bazy --</option>';
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.clientName} - ${p.name || 'Brak nazwy'} (${new Date(p.createdAt || Date.now()).toLocaleDateString()})`;
            select.appendChild(opt);
        });
        btnLoad.addEventListener('click', async () => {
            if (!select.value) { this.showToast('Wybierz projekt z listy!'); return; }
            await this.loadActiveProjectData(select.value);
            this.bindDomElements(); this.updateCalculations(); this.render();
            this.showToast('Wczytano dane z projektu!');
        });
    } catch (e) {
        select.innerHTML = '<option value="""">-- Błąd pobierania bazy --</option>';
    }
  },";

        string replaced = Regex.Replace(text, oldContent, newContent);
        
        // Also call initDbProjectSelector in init()
        string initOld = @"this\.updateDraftsBadge\(\);\s+\},";
        string initNew = @"this.updateDraftsBadge();\n    this.initDbProjectSelector();\n  },";
        replaced = Regex.Replace(replaced, initOld, initNew);
        
        File.WriteAllText(path, replaced, Encoding.UTF8);
        Console.WriteLine("Fix applied.");
    }
}
