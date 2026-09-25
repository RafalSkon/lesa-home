using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

public class FixAdminCAD {
    public static void Main() {
        // Fix app.js in CAD
        string cadJsPath = @"C:\Users\p4cze\LeSa-CAD\app.js";
        string cadJsText = File.ReadAllText(cadJsPath, Encoding.UTF8);
        
        string oldCadInit = @"                if \(project\.investmentCity\) pLoc \+= ', ' \+ project\.investmentCity;
                
                if \(projectNameInput\) projectNameInput\.value = pName;
                if \(projectLocationInput\) projectLocationInput\.value = pLoc;
                currentProjectName = pName;
                currentProjectLocation = pLoc;";
                
        string newCadInit = @"                if (project.investmentCity) pLoc += ', ' + project.investmentCity;
                
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
                }";
                
        cadJsText = Regex.Replace(cadJsText, oldCadInit, newCadInit);
        File.WriteAllText(cadJsPath, cadJsText, Encoding.UTF8);

        // Fix admin2.js
        string adminJsPath = @"c:\LeSa.start\js\admin2.js";
        string adminJsText = File.ReadAllText(adminJsPath, Encoding.UTF8);
        
        string oldViewProject = @"    this.currentViewedProjectId = id;
    this.loadProjectPhotos\(id\);
  \},";
  
        string newViewProject = @"    this.currentViewedProjectId = id;
    this.loadProjectPhotos(id);
    this.loadProjectCadData(id);
  },

  loadProjectCadData(projectId) {
    const proj = this.projects.find(p => p.id === projectId);
    const cadList = document.getElementById('pd-cad-files-list');
    if (!cadList) return;
    
    if (proj && proj.cad_file) {
       let html = `<div class=""p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold mb-2 flex items-center gap-2"">
         <svg class=""w-5 h-5"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M5 13l4 4L19 7""/></svg>
         Projekt CAD został poprawnie zapisany w bazie!
       </div>`;
       
       if (proj.cadData) {
           const area = proj.cadData.area || 0;
           const loops = proj.cadData.loopsCount || 0;
           const mani = proj.cadData.manifolds || 0;
           html += `<div class=""text-slate-700 mt-2"">
               <strong>Zapisane parametry:</strong><br>
               Powierzchnia: ${area} m²<br>
               Pętle: ${loops} szt.<br>
               Rozdzielacze: ${mani} szt.
           </div>`;
       }
       cadList.innerHTML = html;
    } else {
       cadList.innerHTML = `Brak wgranego pliku CAD. Zaprojektuj rzut w LeSa-CAD i kliknij ""Zapisz na serwerze"".`;
    }
  },";
        adminJsText = Regex.Replace(adminJsText, oldViewProject, newViewProject);
        File.WriteAllText(adminJsPath, adminJsText, Encoding.UTF8);
        
        Console.WriteLine("Fixed admin and cad js.");
    }
}
