document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const inpClientName = document.getElementById('inp_client_name');
  const inpAddress = document.getElementById('inp_address');
  const inpCity = document.getElementById('inp_city');
  const inpDate = document.getElementById('inp_date');
  const inpDocNo = document.getElementById('inp_doc_no');

  const docClientName = document.getElementById('doc_client_name');
  const docAddress = document.getElementById('doc_address');
  const docCity = document.getElementById('doc_city');
  const docDate = document.getElementById('doc_date');
  const docNo = document.getElementById('doc_no');
  const docClientNip = document.getElementById('doc_client_nip');
  const docClientPhone = document.getElementById('doc_client_phone');
  const docClientEmail = document.getElementById('doc_client_email');
  
  const inpClientNip = document.getElementById('inp_client_nip');
  const inpClientPhone = document.getElementById('inp_client_phone');
  const inpClientEmail = document.getElementById('inp_client_email');
  
  const docContractor = document.getElementById('doc_contractor');
  const docContractorDetails = document.getElementById('doc_contractor_details');
  const docContractorContact = document.getElementById('doc_contractor_contact');

  let rowsData = [];

  const renderDocumentTable = () => {
    const container = document.getElementById('doc_manifolds_container');
    if (!container) return;
    
    if (rowsData.length === 0) {
      container.innerHTML = '<p class="text-sm italic text-slate-500">Brak dodanych pętli.</p>';
      return;
    }

    const manifolds = {};
    rowsData.forEach(row => {
      const mName = String(row.manifold || 'Nieznany Rozdzielacz').trim();
      if (!manifolds[mName]) manifolds[mName] = [];
      
      const rawLengths = String(row.lengths || '').split(',').map(l => l.trim()).filter(l => l);
      if (rawLengths.length === 0) {
        manifolds[mName].push({
          room: row.room || '-',
          zone: row.zone || 'Grzewcza',
          length: '-'
        });
      } else {
        rawLengths.forEach(len => {
          manifolds[mName].push({
            room: row.room || '-',
            zone: row.zone || 'Grzewcza',
            length: len
          });
        });
      }
    });

    let html = '<div><h3 class="text-sm font-bold uppercase border-b border-slate-200 pb-1 mb-3">2. Zestawienie Instalacji</h3></div>';
    let totalLoops = 0;

    for (const [mName, loops] of Object.entries(manifolds)) {
      totalLoops += loops.length;
      
      let tableRows = '';
      loops.forEach((loop, index) => {
        tableRows += `
          <tr class="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
            <td class="py-1.5 px-3 border-r border-slate-300 text-center font-medium text-slate-700">${index + 1}.</td>
            <td class="py-1.5 px-3 border-r border-slate-300">${escapeQuote(loop.room)}</td>
            <td class="py-1.5 px-3 border-r border-slate-300">${escapeQuote(loop.zone)}</td>
            <td class="py-1.5 px-3 text-center">${escapeQuote(loop.length)}</td>
          </tr>
        `;
      });

      html += `
        <div style="page-break-inside: avoid;">
          <h3 class="text-sm font-bold uppercase border-b border-slate-200 pb-1 mb-2">Rozdzielacz: <span class="text-indigo-700">${mName}</span></h3>
          <table class="w-full text-left border-collapse text-sm mb-6">
            <thead>
              <tr class="bg-slate-100 border-y border-slate-300 text-[10px] uppercase tracking-wider text-slate-600">
                <th class="py-1.5 px-3 font-bold border-r border-slate-300 w-16 text-center">Nr pętli</th>
                <th class="py-1.5 px-3 font-bold border-r border-slate-300">Pomieszczenie</th>
                <th class="py-1.5 px-3 font-bold border-r border-slate-300">Strefa</th>
                <th class="py-1.5 px-3 font-bold text-center w-32">Długość (mb)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 border-b border-slate-300">
              ${tableRows}
            </tbody>
          </table>
        </div>
      `;
    }
    
    html += `
      <div class="text-right text-sm font-bold mt-2 mr-2">
        Łączna ilość pętli (wszystkie rozdzielacze): <span class="text-indigo-700">${totalLoops}</span>
      </div>
    `;

    container.innerHTML = html;
  };

  const saveRowsData = () => { 
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get('projectId') || localStorage.getItem('lesa_active_project_id'); 
    if (pid) localStorage.setItem('lesa_protokol_loops_' + pid, JSON.stringify(rowsData)); 
  };

  const updateRowData = (id, field, value) => {
    const row = rowsData.find(r => r.id === id);
    if (row) {
      row[field] = value;
      renderDocumentTable();
      saveRowsData();
    }
  };

  const deleteRow = (id) => {
    rowsData = rowsData.filter(r => r.id !== id);
    renderEditorTables();
    renderDocumentTable();
    saveRowsData();
  };

  const moveRowUp = (id) => {
    const curIdx = rowsData.findIndex(r => r.id === id);
    if (curIdx === -1) return;
    const curManifold = rowsData[curIdx].manifold;
    let prevIdx = -1;
    for (let i = curIdx - 1; i >= 0; i--) {
      if (rowsData[i].manifold === curManifold) {
        prevIdx = i;
        break;
      }
    }
    if (prevIdx !== -1) {
      const temp = rowsData[prevIdx];
      rowsData[prevIdx] = rowsData[curIdx];
      rowsData[curIdx] = temp;
      renderEditorTables();
      renderDocumentTable();
      saveRowsData();
    }
  };

  const moveRowDown = (id) => {
    const curIdx = rowsData.findIndex(r => r.id === id);
    if (curIdx === -1) return;
    const curManifold = rowsData[curIdx].manifold;
    let nextIdx = -1;
    for (let i = curIdx + 1; i < rowsData.length; i++) {
      if (rowsData[i].manifold === curManifold) {
        nextIdx = i;
        break;
      }
    }
    if (nextIdx !== -1) {
      const temp = rowsData[nextIdx];
      rowsData[nextIdx] = rowsData[curIdx];
      rowsData[curIdx] = temp;
      renderEditorTables();
      renderDocumentTable();
      saveRowsData();
    }
  };

  const updateManifoldName = (oldName, newName) => {
    let changed = false;
    rowsData.forEach(r => {
      if (String(r.manifold || 'Nieznany').trim() === oldName) {
        r.manifold = newName;
        changed = true;
      }
    });
    if (changed) {
      renderEditorTables();
      renderDocumentTable();
      saveRowsData();
    }
  };

  const addRow = (manifoldName) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newRow = { id, manifold: manifoldName, room: '', zone: 'Grzewcza', lengths: '80' };
    rowsData.push(newRow);
    renderEditorTables();
    renderDocumentTable();
    saveRowsData();
  };

  const btnAddRow = document.getElementById('btn_add_row');
  const fetchCadLoops = async (project) => {
    if (!project) return [];
    
    // 1. Try reading directly from s1c file if available to get the most accurate, live manifold and room names
    let cadContent = null;
    let fileUrl = project.cad_file;
    if (!fileUrl && project.files && project.files.length > 0) {
      const cadF = project.files.find(f => f.file_type === 'cad' || (f.file_name && f.file_name.endsWith('.s1c')));
      if (cadF) fileUrl = cadF.file_url;
    }
    
    if (fileUrl) {
      try {
        const res = await fetch(fileUrl + '?_t=' + Date.now());
        if (res.ok) {
          cadContent = await res.json();
        }
      } catch (err) {
        console.warn('Nie udało się pobrać pliku .s1c:', err);
      }
    }
    
    if (cadContent) {
      let levels = [];
      if (cadContent.format === 'LeSa-CAD-s1c-multilevel' && Array.isArray(cadContent.levels)) {
        levels = cadContent.levels;
      } else if (cadContent.rooms) {
        levels = [{ name: 'Poziom 1', state: cadContent }];
      }
      
      const rows = [];
      levels.forEach(lvl => {
        const st = lvl.state || lvl;
        if (!st || !st.rooms) return;
        const mans = st.manifolds || [];
        
        st.rooms.forEach(r => {
          if (r.heatingMode && r.heatingMode !== 'heating') return;
          const count = r.loopCount || (r.customLoopCount > 0 ? r.customLoopCount : 0);
          if (count <= 0) return;
          
          let mName = 'Rozdzielacz 1';
          if (r.manifoldId && mans.length > 0) {
            const foundM = mans.find(m => String(m.id).trim() === String(r.manifoldId).trim());
            if (foundM) {
              mName = levels.length > 1 ? `${lvl.name} - ${foundM.name || 'Rozdzielacz'}` : (foundM.name || 'Rozdzielacz');
            }
          } else if (mans.length === 1) {
            mName = levels.length > 1 ? `${lvl.name} - ${mans[0].name || 'Rozdzielacz'}` : (mans[0].name || 'Rozdzielacz');
          }
          
          const rName = levels.length > 1 ? `${lvl.name} - ${r.name || 'Pomieszczenie'}` : (r.name || 'Pomieszczenie');
          const loopLen = r.avgLoopLength || r.maxLoopLength || 80;
          
          let lengthsStr = '';
          if (r.loopDetails && r.loopDetails.length > 0) {
            lengthsStr = r.loopDetails.map(ld => Math.round(parseFloat(ld.length) || loopLen)).join(', ');
          } else {
            lengthsStr = Array(count).fill(Math.round(loopLen)).join(', ');
          }
          
          rows.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            manifold: String(mName).trim(),
            room: String(rName),
            zone: 'Grzewcza',
            lengths: lengthsStr
          });
        });
      });
      
      if (rows.length > 0) return rows;
    }
    
    // 2. Fallback to cadData if already present
    if (project.cadData && project.cadData.rooms && project.cadData.rooms.length > 0) {
      return project.cadData.rooms.filter(r => r.loopCount > 0).map(cadLoop => {
        let lengthsStr = '';
        if (cadLoop.loopDetails && cadLoop.loopDetails.length > 0) {
          lengthsStr = cadLoop.loopDetails.map(ld => Math.round(parseFloat(ld.length) || cadLoop.maxLoopLength || 80)).join(', ');
        } else {
          const count = cadLoop.loopCount || 1;
          lengthsStr = Array(count).fill(Math.round(cadLoop.maxLoopLength || 80)).join(', ');
        }
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          manifold: String(cadLoop.manifoldName || 'Rozdzielacz 1').trim(),
          room: String(cadLoop.name || 'Pomieszczenie'),
          zone: 'Grzewcza',
          lengths: lengthsStr
        };
      });
    }
    
    return [];
  };

  const btnReloadCad = document.getElementById('btn_reload_cad');
  if (btnReloadCad) {
     btnReloadCad.addEventListener('click', async () => {
        if (!confirm('Czy na pewno chcesz nadpisać obecne pętle danymi z projektu CAD? Wszelkie ręczne zmiany zostaną utracone.')) return;
        
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const pid = urlParams.get('projectId') || localStorage.getItem('lesa_active_project_id');
            let projects = [];
            if (window.ApiService) {
                projects = await ApiService.getProjects();
            } else {
                projects = JSON.parse(localStorage.getItem('lesa_projects')) || [];
            }
            const project = projects.find(p => p.id === pid);
            
            const cadLoops = await fetchCadLoops(project);
            if (cadLoops && cadLoops.length > 0) {
               rowsData = cadLoops;
               renderEditorTables();
               renderDocumentTable();
               saveRowsData();
               alert('Pętle zostały pomyślnie załadowane i podzielone według rozdzielaczy z projektu CAD!');
            } else {
               alert('Nie znaleziono pętli w zapisanym projekcie CAD. Upewnij się, że projekt został zapisany w LeSa-CAD.');
            }
        } catch(e) {
            console.error(e);
            alert('Błąd: ' + e.message);
        }
     });
  }

  const escapeQuote = (val) => String(val || '').replace(/"/g, '&quot;');
  const renderEditorTables = () => {
    const container = document.getElementById('editor-manifolds-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (rowsData.length === 0) {
       container.innerHTML = '<div class="text-slate-500 italic text-sm py-4 text-center border border-slate-200 rounded bg-slate-50">Brak dodanych pętli. Kliknij \'Dodaj wpis\' aby utworzyć nowy rozdzielacz.</div>';
       return;
    }

    const manifolds = {};
    rowsData.forEach(row => {
      const mName = String(row.manifold || 'Nieznany').trim();
      if (!manifolds[mName]) manifolds[mName] = [];
      manifolds[mName].push(row);
    });
    
    for (const [mName, loops] of Object.entries(manifolds)) {
      const wrapper = document.createElement('div');
      wrapper.className = 'border border-slate-200 rounded-xl bg-slate-50 overflow-hidden';
      
      const header = document.createElement('div');
      header.className = 'bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between';
      header.innerHTML = `
        <div class="flex items-center gap-2 w-full max-w-sm">
          <span class="text-xs font-bold text-slate-500 uppercase">Rozdzielacz:</span>
          <input type="text" class="inp-manifold-name w-full px-2 py-1 text-sm font-bold border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 bg-white" value="${escapeQuote(mName)}">
        </div>
        <button type="button" class="btn-add-loop-to-manifold px-2 py-1 bg-white hover:bg-orange-50 text-orange-600 rounded text-xs font-bold border border-slate-200 transition-colors">
          + Dodaj pętlę
        </button>
      `;
      
      const nameInput = header.querySelector('.inp-manifold-name');
      nameInput.addEventListener('change', (e) => {
         const newName = e.target.value.trim();
         if (newName && newName !== mName) {
            updateManifoldName(mName, newName);
         }
      });
      
      header.querySelector('.btn-add-loop-to-manifold').addEventListener('click', () => {
         addRow(mName);
      });
      
      wrapper.appendChild(header);
      
      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'overflow-x-auto p-2';
      
      const table = document.createElement('table');
      table.className = 'w-full text-left text-xs border-collapse';
      table.innerHTML = `
        <thead>
          <tr class="border-b border-slate-200">
            <th class="py-2 px-2 text-slate-500 font-bold uppercase w-10 text-center">Nr</th>
            <th class="py-2 px-2 text-slate-500 font-bold uppercase">Pomieszczenie</th>
            <th class="py-2 px-2 text-slate-500 font-bold uppercase">Strefa</th>
            <th class="py-2 px-2 text-slate-500 font-bold uppercase">Długości</th>
            <th class="py-2 px-2"></th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      
      const tbody = table.querySelector('tbody');
      
      loops.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 last:border-0 hover:bg-white transition-colors';
        tr.innerHTML = `
          <td class="py-2 px-2 text-center text-slate-500 font-medium">${idx + 1}.</td>
          <td class="py-2 px-2">
            <input type="text" class="inp-room w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-orange-500" placeholder="Pomieszczenie" value="${escapeQuote(row.room)}">
          </td>
          <td class="py-2 px-2">
            <input type="text" class="inp-zone w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-orange-500" placeholder="Strefa" value="${escapeQuote(row.zone)}">
          </td>
          <td class="py-2 px-2">
            <input type="text" class="inp-lengths w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-orange-500" placeholder="80, 85" value="${escapeQuote(row.lengths)}">
          </td>
          <td class="py-2 px-2 text-right w-24 whitespace-nowrap">
            <button type="button" class="up-btn text-slate-400 hover:text-indigo-600 px-1 py-0.5 rounded text-sm font-bold" title="Przesuń w górę">▲</button>
            <button type="button" class="down-btn text-slate-400 hover:text-indigo-600 px-1 py-0.5 rounded text-sm font-bold" title="Przesuń w dół">▼</button>
            <button type="button" class="delete-btn text-red-500 hover:text-red-700 font-bold px-1 py-0.5 rounded text-base ml-1" title="Usuń">&times;</button>
          </td>
        `;
        
        const delBtn = tr.querySelector('.delete-btn'); if (delBtn) delBtn.addEventListener('click', () => deleteRow(row.id));
        const upBtn = tr.querySelector('.up-btn'); if (upBtn) upBtn.addEventListener('click', () => moveRowUp(row.id));
        const downBtn = tr.querySelector('.down-btn'); if (downBtn) downBtn.addEventListener('click', () => moveRowDown(row.id));
        tr.querySelector('.inp-room').addEventListener('input', (e) => updateRowData(row.id, 'room', e.target.value));
        tr.querySelector('.inp-zone').addEventListener('input', (e) => updateRowData(row.id, 'zone', e.target.value));
        tr.querySelector('.inp-lengths').addEventListener('input', (e) => updateRowData(row.id, 'lengths', e.target.value));
        
        tbody.appendChild(tr);
      });
      
      tableWrapper.appendChild(table);
      wrapper.appendChild(tableWrapper);
      container.appendChild(wrapper);
    }
  };

  btnAddRow.addEventListener('click', () => addRow('Nowy Rozdzielacz'));

    const loadRowsData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get('projectId') || localStorage.getItem('lesa_active_project_id');
    if (pid) {
      let projects = [];
      if (window.ApiService) {
          projects = await ApiService.getProjects();
      } else {
          projects = JSON.parse(localStorage.getItem('lesa_projects')) || [];
      }
      const project = projects.find(p => p.id === pid);
      
      if (project && project.protocols && project.protocols.odbiorData) {
         const data = project.protocols.odbiorData;
         if (data.date) { document.getElementById('inp_date').value = data.date; document.getElementById('doc_date').textContent = data.date; }
         if (data.docNo) { document.getElementById('inp_doc_no').value = data.docNo; document.getElementById('doc_no').textContent = "Nr: " + data.docNo; }
         
         if (data.sigClient && data.sigClient.startsWith('data:')) {
            const img = document.getElementById('doc_sig_client');
            img.src = data.sigClient;
            img.classList.remove('hidden');
         }
         if (data.sigContractor && data.sigContractor.startsWith('data:')) {
            const img = document.getElementById('doc_sig_contractor');
            img.src = data.sigContractor;
            img.classList.remove('hidden');
         }
         
         if (data.rowsData && data.rowsData.length > 0) {
             rowsData = data.rowsData;
             renderEditorTables(); renderDocumentTable();
             return;
         }
      }
      
      const saved = localStorage.getItem('lesa_protokol_loops_' + pid);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            rowsData = parsed;
            renderEditorTables(); renderDocumentTable();
            return;
          }
        } catch (e) {}
      }
      const cadLoops = await fetchCadLoops(project);
      if (cadLoops && cadLoops.length > 0) {
        rowsData = cadLoops;
        renderEditorTables(); renderDocumentTable();
        saveRowsData();
        return;
      }
    }
    if(rowsData.length === 0) addRow('R1'); else { renderEditorTables(); renderDocumentTable(); } 
  };
    await loadRowsData();
  const sigModal = document.getElementById('signature-modal');
  const btnCloseSig = document.getElementById('btn_close_signature');
  const btnClearSig = document.getElementById('btn_clear_signature');
  const btnSaveSig = document.getElementById('btn_save_signature');
  const sigCanvas = document.getElementById('signature_pad_canvas');
  const sigTitle = document.getElementById('signature-modal-title');
  
  let signaturePad = null;
  let currentTargetImg = null;

  const initSignaturePad = () => {
    if (signaturePad) return;
    signaturePad = new SignaturePad(sigCanvas, {
      minWidth: 1.5,
      maxWidth: 3,
      penColor: '#1e293b'
    });
    
    // Resize canvas properly
    const resizeCanvas = () => {
      const ratio =  Math.max(window.devicePixelRatio || 1, 1);
      sigCanvas.width = sigCanvas.offsetWidth * ratio;
      sigCanvas.height = sigCanvas.offsetHeight * ratio;
      sigCanvas.getContext("2d").scale(ratio, ratio);
      signaturePad.clear();
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  };

  const openSignatureModal = (title, targetImgId) => {
    sigTitle.textContent = title;
    currentTargetImg = document.getElementById(targetImgId);
    sigModal.classList.remove('hidden');
    sigModal.classList.add('flex');
    initSignaturePad();
    signaturePad.clear();
  };

  const closeSignatureModal = () => {
    sigModal.classList.add('hidden');
    sigModal.classList.remove('flex');
    currentTargetImg = null;
  };

  document.getElementById('btn_sign_client').addEventListener('click', () => {
    openSignatureModal('Złóż podpis (Inwestor)', 'doc_sig_client');
  });

  document.getElementById('btn_sign_contractor').addEventListener('click', () => {
    openSignatureModal('Złóż podpis (Wykonawca)', 'doc_sig_contractor');
  });

  btnCloseSig.addEventListener('click', closeSignatureModal);
  
  btnClearSig.addEventListener('click', () => {
    if (signaturePad) signaturePad.clear();
  });

  btnSaveSig.addEventListener('click', () => {
    if (signaturePad && currentTargetImg) {
      if (signaturePad.isEmpty()) {
        alert("Proszę złożyć podpis przed zapisaniem.");
        return;
      }
      currentTargetImg.src = signaturePad.toDataURL('image/png');
      currentTargetImg.classList.remove('hidden');
      closeSignatureModal();
    }
  });
  const btnSaveProtocol = document.getElementById('btn-save-protocol');
  if (btnSaveProtocol) {
    btnSaveProtocol.addEventListener('click', async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const activeProjectId = urlParams.get('projectId') || localStorage.getItem('lesa_active_project_id');
      if (activeProjectId) {
        let projects = [];
        if (window.ApiService) {
            projects = await ApiService.getProjects();
        } else {
            projects = JSON.parse(localStorage.getItem('lesa_projects')) || [];
        }
        const idx = projects.findIndex(p => p.id === activeProjectId);
        if (idx !== -1) {
          const formData = {
              clientName: document.getElementById('inp_client_name') ? document.getElementById('inp_client_name').value : '',
              address: document.getElementById('inp_address') ? document.getElementById('inp_address').value : '',
              city: document.getElementById('inp_city') ? document.getElementById('inp_city').value : '',
              date: document.getElementById('inp_date') ? document.getElementById('inp_date').value : '',
              docNo: document.getElementById('inp_doc_no') ? document.getElementById('inp_doc_no').value : '',
              sigClient: document.getElementById('doc_sig_client') ? document.getElementById('doc_sig_client').src : '',
              sigContractor: document.getElementById('doc_sig_contractor') ? document.getElementById('doc_sig_contractor').src : '',
              rowsData: rowsData || []
          };
          
          projects[idx].protocols = projects[idx].protocols || {};
          projects[idx].protocols.odbior = true;
          projects[idx].protocols.odbiorDate = new Date().toISOString();
          projects[idx].protocols.odbiorData = formData;
          localStorage.setItem('lesa_protocol_odbior_' + activeProjectId, JSON.stringify({ savedAt: new Date().toISOString(), data: formData }));
          
          try {
             if (window.ApiService) {
                 await ApiService.saveProject(projects[idx]);
             } else {
                 localStorage.setItem('lesa_projects', JSON.stringify(projects));
             }
             alert('Protok� odbioru zosta� zapisany w systemie.');
          } catch (e) {
             console.error("B��d zapisu:", e);
             alert('B��d podczas zapisywania protoko�u. Szczeg�y: ' + e.message);
          }
        } else {
          alert('Nie znaleziono aktywnego projektu.');
        }
      } else {
        alert('Brak aktywnego projektu do zapisu.');
      }
    });
  }
});

















