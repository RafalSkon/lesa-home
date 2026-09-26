document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const inpClientName = document.getElementById('inp_client_name');
  const inpClientAddress = document.getElementById('inp_client_address');
  const inpAddress = document.getElementById('inp_address');
  const inpCity = document.getElementById('inp_city');
  const inpDate = document.getElementById('inp_date');
  const inpMedium = document.getElementById('inp_medium');
  
  const inpLoopsCount = document.getElementById('inp_loops_count');
  const inpManifoldType = document.getElementById('inp_manifold_type');
  const inpPipeType = document.getElementById('inp_pipe_type');
  const inpTemp = document.getElementById('inp_temp');
  const inpPressureStart = document.getElementById('inp_pressure_start');
  const inpPressureEnd = document.getElementById('inp_pressure_end');
  const inpManometer = document.getElementById('inp_manometer');

  const docClientName = document.getElementById('doc_client_name');
  const docClientAddress = document.getElementById('doc_client_address');
  const docAddress = document.getElementById('doc_address');
  const docCity = document.getElementById('doc_city');
  const docDate = document.getElementById('doc_date');
  const docMedium = document.getElementById('doc_medium');
  
  const docClientNip = document.getElementById('doc_client_nip');
  const docClientPhone = document.getElementById('doc_client_phone');
  const docClientEmail = document.getElementById('doc_client_email');
  
  const inpClientNip = document.getElementById('inp_client_nip');
  const inpClientPhone = document.getElementById('inp_client_phone');
  const inpClientEmail = document.getElementById('inp_client_email');
  
  const docLoopsCount = document.getElementById('doc_loops_count');
  const docManifoldType = document.getElementById('doc_manifold_type');
  const docPipeType = document.getElementById('doc_pipe_type');
  const docTemp = document.getElementById('doc_temp');
  const docPressureStart = document.getElementById('doc_pressure_start');
  const docPressureEnd = document.getElementById('doc_pressure_end');
  const docManometer = document.getElementById('doc_manometer');
  
  const docContractor = document.getElementById('doc_contractor');
  const docContractorDetails = document.getElementById('doc_contractor_details');
  const docContractorContact = document.getElementById('doc_contractor_contact');

  const inpPhoto1 = document.getElementById('inp_photo1');
  const inpPhoto2 = document.getElementById('inp_photo2');
  const container1 = document.getElementById('photo_container_1');
  const container2 = document.getElementById('photo_container_2');

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

  const loadActiveProjectData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const activeProjectId = urlParams.get('projectId') || localStorage.getItem('lesa_active_project_id');
    if (activeProjectId) {
      try {
        let projects = [];
        let clients = [];
        if (window.ApiService) {
            projects = await ApiService.getProjects();
            clients = await ApiService.getClients();
        } else {
            projects = JSON.parse(localStorage.getItem('lesa_projects')) || [];
            clients = JSON.parse(localStorage.getItem('lesa_clients')) || [];
        }
        
        const project = projects.find(p => p.id === activeProjectId);
        if (project) {
          const cId = project.clientId || project.client_id;
          const client = clients.find(c => c.id === cId);
          
          let cName = (client && (client.name || client.client_name || client.companyName)) || project.clientName || project.client_name || '';
          
          let cAddr = '';
          if (client) {
            cAddr = client.address || client.address_home || client.address_company || '';
            if (client.city && cAddr && !cAddr.toLowerCase().includes(client.city.toLowerCase())) {
              cAddr += ', ' + client.city;
            } else if (!cAddr && client.city) {
              cAddr = client.city;
            }
          }
          if (!cAddr) {
            cAddr = project.clientAddress || project.address_home || '';
          }

          let invAddr = project.investmentAddress || project.address || '';
          const invCity = project.investmentCity || project.city || '';
          if (invAddr && invCity && !invAddr.toLowerCase().includes(invCity.toLowerCase())) {
            invAddr += ', ' + invCity;
          } else if (!invAddr && invCity) {
            invAddr = invCity;
          }
          if (!invAddr) {
            invAddr = cAddr;
          }
          
          inpClientName.value = cName;
          if (inpClientAddress) inpClientAddress.value = cAddr;
          inpAddress.value = invAddr;
          inpCity.value = invCity || (client && client.city) || '';
          
          if(inpClientNip) inpClientNip.value = (client && client.nip) || project.clientNip || '';
          if(inpClientPhone) inpClientPhone.value = (client && client.phone) || project.clientPhone || '';
          if(inpClientEmail) inpClientEmail.value = (client && client.email) || project.clientEmail || '';
          
          docClientName.textContent = cName || '________________________';
          if(docClientAddress) docClientAddress.textContent = cAddr || '________________________';
          docAddress.textContent = invAddr || '________________________';
          docCity.textContent = inpCity.value;
          
          if(docClientNip) docClientNip.textContent = (client && client.nip) || project.clientNip || '_________________';
          if(docClientPhone) docClientPhone.textContent = (client && client.phone) || project.clientPhone || '_________';
          if(docClientEmail) docClientEmail.textContent = (client && client.email) || project.clientEmail || '_________';

          if (project.cadData) {
             if (project.cadData.loopsCount) {
               inpLoopsCount.value = project.cadData.loopsCount;
               docLoopsCount.textContent = project.cadData.loopsCount;
             }
          }
          
          if (project.protocols && project.protocols.szczelnoscData) {
             const data = project.protocols.szczelnoscData;
             if (data.clientName) { inpClientName.value = data.clientName; docClientName.textContent = data.clientName; }
             if (data.clientAddress && inpClientAddress) { inpClientAddress.value = data.clientAddress; if (docClientAddress) docClientAddress.textContent = data.clientAddress; }
             if (data.address) { inpAddress.value = data.address; docAddress.textContent = data.address; }
             if (data.date) inpDate.value = data.date;
             if (data.medium) inpMedium.value = data.medium;
             if (data.loopsCount) inpLoopsCount.value = data.loopsCount;
             if (data.manifoldType) inpManifoldType.value = data.manifoldType;
             if (data.pipeType) inpPipeType.value = data.pipeType;
             if (data.temp) inpTemp.value = data.temp;
             if (data.pressureStart) inpPressureStart.value = data.pressureStart;
             if (data.pressureEnd) inpPressureEnd.value = data.pressureEnd;
             if (data.manometer) inpManometer.value = data.manometer;
             
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
             if (data.photo1 && data.photo1.startsWith('data:')) {
                const img = new Image();
                img.src = data.photo1;
                img.className = 'w-full h-full object-contain object-center';
                const cont = document.getElementById('photo_container_1');
                cont.innerHTML = '';
                cont.appendChild(img);
                cont.classList.remove('border-dashed', 'border-2', 'border-slate-300');
             }
             if (data.photo2 && data.photo2.startsWith('data:')) {
                const img = new Image();
                img.src = data.photo2;
                img.className = 'w-full h-full object-contain object-center';
                const cont = document.getElementById('photo_container_2');
                cont.innerHTML = '';
                cont.appendChild(img);
                cont.classList.remove('border-dashed', 'border-2', 'border-slate-300');
             }
             
             // Trigger updates for right side document
             setTimeout(() => {
                [inpDate, inpMedium, inpLoopsCount, inpManifoldType, inpPipeType, inpTemp, inpPressureStart, inpPressureEnd, inpManometer].forEach(el => {
                   if(el) el.dispatchEvent(new Event('input'));
                });
             }, 50);
          }
        }
      } catch (e) {
          console.error(e);
      }
    }
  };

  loadContractorSettings();
  await loadActiveProjectData();

  // Set default date only if it wasn't loaded from save
  const today = new Date().toISOString().split('T')[0];
  if (!inpDate.value) {
      inpDate.value = today;
      docDate.textContent = today;
  }

  // Bind input events to document output
  const bindInput = (input, outputElement, defaultValue = '________________________') => {
    if (!input || !outputElement) return;
    input.addEventListener('input', (e) => {
      outputElement.textContent = e.target.value.trim() || defaultValue;
    });
  };

  bindInput(inpClientName, docClientName);
  if (inpClientAddress && docClientAddress) bindInput(inpClientAddress, docClientAddress);
  
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
  
  if(inpClientNip) bindInput(inpClientNip, docClientNip, '_________________');
  if(inpClientPhone) bindInput(inpClientPhone, docClientPhone, '_________');
  if(inpClientEmail) bindInput(inpClientEmail, docClientEmail, '_________');
  bindInput(inpDate, docDate, today);
  
  bindInput(inpLoopsCount, docLoopsCount, '______');
  bindInput(inpManifoldType, docManifoldType, '_________________');
  bindInput(inpPipeType, docPipeType, '_________________');
  bindInput(inpTemp, docTemp, '______');
  bindInput(inpPressureStart, docPressureStart, '6.0');
  bindInput(inpPressureEnd, docPressureEnd, '6.0');
  bindInput(inpManometer, docManometer, '____________');
  
  inpMedium.addEventListener('change', (e) => {
    docMedium.textContent = e.target.value;
  });

  // Photo Upload and Timestamp Drawing
  const handlePhotoUpload = (fileInput, container) => {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to draw image and timestamp
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimensions for the protocol layout
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          // Resize if needed
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw Image
          ctx.drawImage(img, 0, 0, width, height);

          // Get Current Date & Time
          const now = new Date();
          const timestamp = now.toLocaleDateString('pl-PL') + ' ' + now.toLocaleTimeString('pl-PL');

          // Draw Timestamp overlay
          const fontSize = Math.max(16, Math.floor(width * 0.04));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          
          const padding = fontSize;
          const x = width - padding;
          const y = height - padding;

          // Text shadow/background for readability
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          const textMetrics = ctx.measureText(timestamp);
          const bgWidth = textMetrics.width + padding;
          const bgHeight = fontSize + padding;
          ctx.fillRect(x - textMetrics.width - (padding/2), y - fontSize - (padding/4), bgWidth, bgHeight);

          // Text
          ctx.fillStyle = '#ff9900'; // Orange/amber color for visibility
          ctx.fillText(timestamp, x, y);

          // Replace container content with the canvas/image
          const resultImg = new Image();
          resultImg.src = canvas.toDataURL('image/jpeg', 0.9);
          resultImg.className = 'w-full h-full object-contain object-center';
          
          container.innerHTML = '';
          container.appendChild(resultImg);
          container.classList.remove('border-dashed', 'border-2', 'border-slate-300');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  handlePhotoUpload(inpPhoto1, container1);
  handlePhotoUpload(inpPhoto2, container2);

  // Initialize
  loadContractorSettings();

  // --- Signature Pad Logic ---
  // Signature Modal Logic
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

  // Save Protocol to System
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
              clientAddress: document.getElementById('inp_client_address') ? document.getElementById('inp_client_address').value : '',
              address: document.getElementById('inp_address') ? document.getElementById('inp_address').value : '',
              city: document.getElementById('inp_city') ? document.getElementById('inp_city').value : '',
              date: document.getElementById('inp_date') ? document.getElementById('inp_date').value : '',
              medium: document.getElementById('inp_medium') ? document.getElementById('inp_medium').value : '',
              loopsCount: document.getElementById('inp_loops_count') ? document.getElementById('inp_loops_count').value : '',
              manifoldType: document.getElementById('inp_manifold_type') ? document.getElementById('inp_manifold_type').value : '',
              pipeType: document.getElementById('inp_pipe_type') ? document.getElementById('inp_pipe_type').value : '',
              temp: document.getElementById('inp_temp') ? document.getElementById('inp_temp').value : '',
              pressureStart: document.getElementById('inp_pressure_start') ? document.getElementById('inp_pressure_start').value : '',
              pressureEnd: document.getElementById('inp_pressure_end') ? document.getElementById('inp_pressure_end').value : '',
              manometer: document.getElementById('inp_manometer') ? document.getElementById('inp_manometer').value : '',
              sigClient: document.getElementById('doc_sig_client') ? document.getElementById('doc_sig_client').src : '',
              sigContractor: document.getElementById('doc_sig_contractor') ? document.getElementById('doc_sig_contractor').src : ''
          };
          
          const photo1 = document.getElementById('photo_container_1') ? document.getElementById('photo_container_1').querySelector('img') : null;
          if (photo1 && photo1.src.startsWith('data:')) formData.photo1 = photo1.src;
          
          const photo2 = document.getElementById('photo_container_2') ? document.getElementById('photo_container_2').querySelector('img') : null;
          if (photo2 && photo2.src.startsWith('data:')) formData.photo2 = photo2.src;

          projects[idx].protocols = projects[idx].protocols || {};
          projects[idx].protocols.szczelnosc = true;
          projects[idx].protocols.szczelnoscDate = new Date().toISOString();
          projects[idx].protocols.szczelnoscData = formData;
          
          localStorage.setItem('lesa_protocol_szczelnosc_' + activeProjectId, JSON.stringify({
              savedAt: new Date().toISOString(),
              data: formData
          }));
          
          try {
             if (window.ApiService) {
                 await ApiService.saveProject(projects[idx]);
             } else {
                 localStorage.setItem('lesa_projects', JSON.stringify(projects));
             }
             alert('Protokół szczelności został zapisany w systemie.');
          } catch (e) {
             console.error("Błąd zapisu:", e);
             alert('Błąd podczas zapisywania protokołu. Szczegóły: ' + e.message);
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


