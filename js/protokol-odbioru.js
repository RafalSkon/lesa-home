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

  const btnAddRow = document.getElementById('btn_add_row');
  const loopsContainer = document.getElementById('loops-container');
  const docLoopsTbody = document.getElementById('doc_loops_tbody');
  const docTotalLoops = document.getElementById('doc_total_loops');

  let rowsData = [];

  // Load Contractor Data from localStorage (same as admin settings)
  const loadContractorSettings = () => {
    const settings = localStorage.getItem('lesa_admin_settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed.companyName) docContractor.textContent = parsed.companyName;
        const details = [];
        if (parsed.companyAddress) details.push(parsed.companyAddress);
        if (parsed.companyNip) details.push(parsed.companyNip);
        if (details.length > 0) docContractorDetails.textContent = details.join(', ');
        
        if (docContractorContact) {
            docContractorContact.textContent = `Tel: ${parsed.companyPhone || '_________'} • E-mail: ${parsed.companyEmail || '_________'}`;
        }
      } catch (e) {
        console.error('Błąd ładowania ustawień:', e);
      }
    }
  };

  const loadActiveProjectData = () => {
    const activeProjectId = localStorage.getItem('lesa_active_project_id');
    if (activeProjectId) {
      try {
        const projects = JSON.parse(localStorage.getItem('lesa_projects')) || [];
        const clients = JSON.parse(localStorage.getItem('lesa_clients')) || [];
        const project = projects.find(p => p.id === activeProjectId);
        if (project) {
          const client = clients.find(c => c.id === project.clientId);
          
          inpClientName.value = client ? client.name : '';
          inpAddress.value = project.investmentAddress || (client ? client.address : '');
          inpCity.value = project.investmentCity || '';
          
          if(inpClientNip) inpClientNip.value = client ? client.nip : '';
          if(inpClientPhone) inpClientPhone.value = client ? client.phone : '';
          if(inpClientEmail) inpClientEmail.value = client ? client.email : '';
          
          docClientName.textContent = client ? client.name : '________________________';
          
          const parts = [];
          if(inpAddress.value) parts.push(inpAddress.value);
          if(inpCity.value) parts.push(inpCity.value);
          docAddress.textContent = parts.length > 0 ? parts.join(', ') : '________________________';
          
          docCity.textContent = inpCity.value;
          if(docClientNip) docClientNip.textContent = (client && client.nip) ? client.nip : '_________________';
          if(docClientPhone) docClientPhone.textContent = (client && client.phone) ? client.phone : '_________';
          if(docClientEmail) docClientEmail.textContent = (client && client.email) ? client.email : '_________';
        }
      } catch (e) {
          console.error(e);
      }
    }
  };

  loadContractorSettings();
  await loadActiveProjectData();

  // Set default date
  const today = new Date().toISOString().split('T')[0];
  inpDate.value = today;
  docDate.textContent = today;

  // Bind simple inputs
  const bindInput = (input, outputElement, prefix = '', defaultValue = '________________________') => {
    if (!input || !outputElement) return;
    input.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      outputElement.textContent = val ? prefix + val : defaultValue;
    });
  };

  bindInput(inpClientName, docClientName);
  
  const updateDocAddress = () => {
    const addr = inpAddress.value.trim();
    const city = inpCity.value.trim();
    const parts = [];
    if(addr) parts.push(addr);
    if(city) parts.push(city);
    docAddress.textContent = parts.length > 0 ? parts.join(', ') : '________________________';
  };
  bindInput(inpAddress, docAddress);
  inpCity.addEventListener('input', () => {
    updateDocAddress();
    docCity.textContent = inpCity.value.trim() || '';
  });
  bindInput(inpDate, docDate, '', today);
  bindInput(inpDocNo, docNo, 'Nr: ', 'Nr: ______');
  
  if(inpClientNip) bindInput(inpClientNip, docClientNip, '', '_________________');
  if(inpClientPhone) bindInput(inpClientPhone, docClientPhone, '', '_________');
  if(inpClientEmail) bindInput(inpClientEmail, docClientEmail, '', '_________');

  // Dynamic Rows Logic
  const renderDocumentTable = () => {
    const container = document.getElementById('doc_manifolds_container');
    if (!container) return;

    if (rowsData.length === 0) {
      container.innerHTML = `
        <div>
          <h3 class="text-sm font-bold uppercase border-b border-slate-200 pb-1 mb-3">2. Zestawienie Instalacji</h3>
          <div class="text-slate-500 italic text-sm py-4 text-center border border-slate-200 rounded bg-slate-50">
            Brak dodanych pętli.
          </div>
        </div>
      `;
      return;
    }

    // Group by manifold
    const manifolds = {};
    rowsData.forEach(row => {
      const mName = (row.manifold || 'Nieznany Rozdzielacz').trim();
      if (!manifolds[mName]) {
        manifolds[mName] = [];
      }
      
      // Split lengths by comma
      const lengths = (row.lengths || '').split(',').map(l => l.trim()).filter(l => l);
      if (lengths.length === 0) {
        manifolds[mName].push({
          room: row.room || '-',
          zone: row.zone || '-',
          length: '-'
        });
      } else {
        lengths.forEach(len => {
          manifolds[mName].push({
            room: row.room || '-',
            zone: row.zone || '-',
            length: len
          });
        });
      }
    });

    let html = '';
    let totalLoops = 0;

    for (const [mName, loops] of Object.entries(manifolds)) {
      totalLoops += loops.length;
      
      let tableRows = '';
      loops.forEach((loop, index) => {
        tableRows += `
          <tr class="hover:bg-slate-50">
            <td class="py-1 px-3 border-r border-slate-300 text-center text-xs">${index + 1}.</td>
            <td class="py-1 px-3 border-r border-slate-300 font-medium text-xs">${loop.room}</td>
            <td class="py-1 px-3 border-r border-slate-300 text-xs">${loop.zone}</td>
            <td class="py-1 px-3 text-center font-bold text-xs">${loop.length}</td>
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

  const saveRowsData = () => { const pid = localStorage.getItem('lesa_active_project_id'); if (pid) localStorage.setItem('lesa_protokol_loops_' + pid, JSON.stringify(rowsData)); };

  const updateRowData = (id, field, value) => {
    const row = rowsData.find(r => r.id === id);
    if (row) {
      row[field] = value;
      renderDocumentTable();
      saveRowsData();
    }
  };

  const deleteRow = (id, domElement) => {
    rowsData = rowsData.filter(r => r.id !== id);
    domElement.remove();
    renderDocumentTable();
    saveRowsData();
  };

  const addRow = (initialData = null) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newRow = initialData || { id, manifold: '', room: '', zone: '', lengths: '' };
    if (!initialData) rowsData.push(newRow);

    const rowDiv = document.createElement('tr');
    rowDiv.className = 'border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors';
    
    rowDiv.innerHTML = `
        <td class="py-2 pr-2">
          <input type="text" class="inp-manifold w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-orange-500" placeholder="R1" value="${newRow.manifold || ''}">
        </td>
        <td class="py-2 pr-2">
          <input type="text" class="inp-room w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-orange-500" placeholder="Pomieszczenie" value="${newRow.room || ''}">
        </td>
        <td class="py-2 pr-2">
          <input type="text" class="inp-zone w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-orange-500" placeholder="Strefa" value="${newRow.zone || ''}">
        </td>
        <td class="py-2 pr-2">
          <input type="text" class="inp-lengths w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-orange-500" placeholder="80, 85" value="${newRow.lengths || ''}">
        </td>
        <td class="py-2 text-right">
          <button type="button" class="text-red-500 hover:text-red-700 font-bold delete-btn" title="Usuń">&times;</button>
        </td>
      `;

    rowDiv.querySelector('.delete-btn').addEventListener('click', () => deleteRow(newRow.id, rowDiv));
    rowDiv.querySelector('.inp-manifold').addEventListener('input', (e) => updateRowData(newRow.id, 'manifold', e.target.value));
    rowDiv.querySelector('.inp-room').addEventListener('input', (e) => updateRowData(newRow.id, 'room', e.target.value));
    rowDiv.querySelector('.inp-zone').addEventListener('input', (e) => updateRowData(newRow.id, 'zone', e.target.value));
    rowDiv.querySelector('.inp-lengths').addEventListener('input', (e) => updateRowData(newRow.id, 'lengths', e.target.value));

    loopsContainer.appendChild(rowDiv);
    renderDocumentTable();
    if (!initialData) saveRowsData();
  };

  btnAddRow.addEventListener('click', () => addRow());

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
      
      if (project && project.protocols && project.protocols.odbiorData && project.protocols.odbiorData.rowsData) {
         rowsData = project.protocols.odbiorData.rowsData;
         rowsData.forEach(row => addRow(row));
         
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
         
         return;
      }
      
      const saved = localStorage.getItem('lesa_protokol_loops_' + pid);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            rowsData = parsed;
            rowsData.forEach(row => addRow(row));
            return;
          }
        } catch (e) {}
      }
      if (project && project.cadData && project.cadData.rooms && project.cadData.rooms.length > 0) {
        rowsData = project.cadData.rooms.filter(r => r.loopCount > 0).map(cadLoop => {
          return {
             id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
             manifold: (cadLoop.manifoldName || 'R1'),
             room: cadLoop.name || 'Pomieszczenie',
             zone: 'Grzewcza',
             lengths: cadLoop.loopCount ? Array(cadLoop.loopCount).fill(cadLoop.maxLoopLength || 80).join(', ') : '80'
          };
        });
        rowsData.forEach(row => addRow(row));
        saveRowsData();
        return;
      }
    }
    addRow(); 
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


