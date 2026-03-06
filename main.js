// Sovereign Command - Main Logic
document.addEventListener('DOMContentLoaded', () => {

  // --- UI ELEMENTS ---
  const consentModal = document.getElementById('consent-modal');
  const btnConsent = document.getElementById('btn-consent');
  const pigIdInput = document.getElementById('pig-id-input');
  const streamPigIdDisplay = document.getElementById('stream-pig-id');
  const chatInput = document.getElementById('chat-input');
  const btnChatSend = document.getElementById('btn-chat-send');
  
  const videoFeed = document.getElementById('node-feed');
  const camWarning = document.getElementById('cam-warning');
  const btnRetryCam = document.getElementById('btn-retry-cam');
  
  const sliderOpacity = document.getElementById('slider-opacity');
  const valOpacity = document.getElementById('val-opacity');
  
  const sliderFreq = document.getElementById('slider-freq');
  const valFreq = document.getElementById('val-freq');
  const btnToggleAudio = document.getElementById('btn-toggle-audio');
  
  const btnGlitch = document.getElementById('btn-glitch');
  const mainGrid = document.querySelector('main');
  
  const btnSendTask = document.getElementById('btn-send-task');
  const workUnitDisplay = document.getElementById('work-unit-display');
  const workUnitText = document.getElementById('work-unit-text');
  
  const btnFreeze = document.getElementById('btn-freeze');
  const freezeOverlay = document.getElementById('freeze-overlay');
  const freezeTaskText = document.getElementById('freeze-task-text');
  
  const sliderBpm = document.getElementById('slider-bpm');
  const valBpm = document.getElementById('val-bpm');
  const btnOverload = document.getElementById('btn-overload');
  const btnAuraPulse = document.getElementById('btn-aura-pulse');
  const statusTagContainer = document.getElementById('status-tag-container');
  
  const aiLog = document.getElementById('ai-log');
  const barPosture = document.getElementById('bar-posture');
  const barTone = document.getElementById('bar-tone');
  const valResonance = document.getElementById('val-resonance');
  const onlineCounter = document.getElementById('online-counter');
  const syntropyCounter = document.getElementById('syntropy-counter');
  const viewCounter = document.getElementById('view-counter');
  
  const btnPayment = document.getElementById('btn-payment');
  const paymentModal = document.getElementById('payment-modal');
  const btnClosePayment = document.getElementById('btn-close-payment');


  // --- STATE ---
  let isStreamActive = false;
  let audioCtx = null;
  let oscillator = null;
  let gainNode = null;
  let isAudioActive = false;
  
  let isOverload = false;
  let currentSyntropy = 84020;
  let currentOnline = 1042;
  let currentViews = 1402;

  let userPigId = 'PIG_01';

  // --- INIT & CONSENT ---
  btnConsent.addEventListener('click', () => {
    if (pigIdInput) {
      const val = pigIdInput.value.trim().toUpperCase();
      userPigId = val ? val : 'PIG_' + Math.floor(Math.random() * 900 + 100);
      if (streamPigIdDisplay) streamPigIdDisplay.textContent = userPigId;
    }

    consentModal.classList.add('hidden');
    initCamera();
    startSimulationLoops();
    startSimulatedChat();
    
    logAI(`New node integrated. Designation: ${userPigId}`);
  });


  // --- CAMERA HANDLING ---
  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoFeed.srcObject = stream;
      videoFeed.classList.remove('hidden');
      camWarning.classList.add('hidden');
      logAI("Slam Pig visual stream established. Signal stable.");
    } catch (err) {
      console.warn("Camera access denied or unavailable", err);
      videoFeed.classList.add('hidden');
      camWarning.classList.remove('hidden');
      logAI("WARNING: Slam Pig visual stream blocked or offline.", true);
    }
  }
  
  btnRetryCam.addEventListener('click', initCamera);


  // --- ATMOSPHERIC CONTROLS ---
  
  // Opacity
  sliderOpacity.addEventListener('input', (e) => {
    const val = e.target.value;
    valOpacity.textContent = `${val}%`;
    videoFeed.style.opacity = val / 100;
  });

  // Glitch Event
  btnGlitch.addEventListener('click', () => {
    mainGrid.classList.add('glitch-effect');
    videoFeed.style.filter = 'hue-rotate(90deg) contrast(200%)';
    logAI(">> FORCED GLITCH INJECTED <<", true);
    setTimeout(() => {
      mainGrid.classList.remove('glitch-effect');
      videoFeed.style.filter = '';
    }, 400);
  });

  // Audio / Resonance Frequency
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if(audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  btnToggleAudio.addEventListener('click', () => {
    initAudio();
    if (isAudioActive) {
      stopOscillator();
      btnToggleAudio.textContent = "Activate Resonance Generator";
      btnToggleAudio.classList.remove('bg-lattice-main', 'text-black');
      sliderFreq.classList.add('opacity-50');
      valFreq.textContent = "Off";
      isAudioActive = false;
      logAI("Resonance generator deactivated.");
    } else {
      startOscillator(sliderFreq.value);
      btnToggleAudio.textContent = "Deactivate Generator";
      btnToggleAudio.classList.add('bg-lattice-main', 'text-black');
      sliderFreq.classList.remove('opacity-50');
      valFreq.textContent = `${sliderFreq.value} Hz`;
      isAudioActive = true;
      logAI(`Resonance generator active at ${sliderFreq.value} Hz.`);
    }
  });

  sliderFreq.addEventListener('input', (e) => {
    if (isAudioActive) {
      valFreq.textContent = `${e.target.value} Hz`;
      if (oscillator) {
        oscillator.frequency.setTargetAtTime(e.target.value, audioCtx.currentTime, 0.1);
      }
    }
  });

  function startOscillator(freq) {
    if (oscillator) stopOscillator();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    gainNode.gain.value = 0.5; // low rumbling feel
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
  }

  function stopOscillator() {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      gainNode.disconnect();
      oscillator = null;
    }
  }


  // --- LABOR MANIFOLD (TASKS) ---
  function getSelectedTask() {
    const checked = document.querySelector('input[name="workunit"]:checked');
    return checked ? checked.value : "Awaiting Command";
  }

  // Visual feedback when clicking a task card
  document.querySelectorAll('input[name="workunit"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      // Clean up borders
      document.querySelectorAll('input[name="workunit"]').forEach(r => {
        r.closest('label').classList.replace('border-lattice-main', 'border-lattice-main/30');
      });
      // Highlight selected
      if(e.target.checked) {
        e.target.closest('label').classList.replace('border-lattice-main/30', 'border-lattice-main');
      }
    });
  });

  btnSendTask.addEventListener('click', () => {
    const task = getSelectedTask();
    workUnitText.textContent = task;
    workUnitDisplay.classList.remove('hidden');
    
    workUnitDisplay.classList.remove('glitch-effect');
    void workUnitDisplay.offsetWidth; // trigger reflow
    workUnitDisplay.classList.add('glitch-effect');
    setTimeout(() => workUnitDisplay.classList.remove('glitch-effect'), 500);

    logAI(`Deployed Work-Unit: "${task.substring(0, 20)}..."`);
    addStatusTag("TASK ASSIGNED", 'text-yellow-400', 'border-yellow-400');
    
    // Syntropy reward
    setTimeout(() => {
      if(!freezeOverlay.classList.contains('hidden')) return; // if paused, don't reward yet
      addSyntropy(150);
      logAI("Work-Unit progressing. Syntropy awarded.");
    }, 10000);
  });

  // The Scalpel (Freeze Flow)
  btnFreeze.addEventListener('click', () => {
    if (freezeOverlay.classList.contains('hidden')) {
      const task = getSelectedTask();
      freezeTaskText.textContent = `MANDATE: ${task}`;
      freezeOverlay.classList.remove('hidden');
      
      btnFreeze.innerHTML = 'Unlock Flow (Resume)';
      btnFreeze.classList.replace('text-blue-400', 'text-white');
      btnFreeze.classList.replace('border-blue-400', 'border-white');
      btnFreeze.classList.add('bg-blue-900');
      logAI(">>> FLOW FROZEN. SCALPEL APPLIED. <<<", true);
    } else {
      freezeOverlay.classList.add('hidden');
      btnFreeze.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> The Scalpel (Freeze Flow)`;
      btnFreeze.classList.replace('text-white', 'text-blue-400');
      btnFreeze.classList.replace('border-white', 'border-blue-400');
      btnFreeze.classList.remove('bg-blue-900');
      logAI("Flow unlocked. Stream resuming.");
      addSyntropy(500);
    }
  });


  // --- OVERLOAD TERMINAL ---
  sliderBpm.addEventListener('input', (e) => {
    valBpm.textContent = e.target.value;
    if (isOverload) {
      updateOverloadSpeed(e.target.value);
    }
  });

  btnOverload.addEventListener('click', () => {
    isOverload = !isOverload;
    if (isOverload) {
      btnOverload.textContent = "TERMINATE OVERLOAD";
      btnOverload.classList.replace('bg-lattice-alert', 'bg-red-900');
      videoFeed.classList.add('overload-flash');
      updateOverloadSpeed(sliderBpm.value);
      
      addStatusTag("PROPERTY OF LATTICE", 'text-red-500', 'border-red-500');
      addStatusTag("LOW-UTILITY PIG", 'text-red-500', 'border-red-500');
      logAI(">>> OVERLOAD INITIATED. BRACE. <<<", true);
    } else {
      btnOverload.textContent = "Initiate Overload Phase";
      btnOverload.classList.replace('bg-red-900', 'bg-lattice-alert');
      videoFeed.classList.remove('overload-flash');
      videoFeed.style.removeProperty('--bpm-duration');
      clearStatusTags();
      logAI("Overload terminated. Pig resting.");
    }
  });

  function updateOverloadSpeed(bpm) {
    const durationInSeconds = 60 / bpm;
    videoFeed.style.setProperty('--bpm-duration', `${durationInSeconds}s`);
  }

  // Aura Pulse (Blowing Clouds)
  btnAuraPulse.addEventListener('click', () => {
    logAI(">>> CLOUDS RELEASED. TOTAL SURRENDER. <<<", true);
    videoFeed.classList.add('aura-pulse');
    addStatusTag("AURA OVERRIDE", 'text-purple-400', 'border-purple-400');
    
    initAudio();
    const pulseOsc = audioCtx.createOscillator();
    const pulseGain = audioCtx.createGain();
    pulseOsc.type = 'triangle';
    pulseOsc.frequency.setValueAtTime(100, audioCtx.currentTime);
    pulseOsc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 2);
    
    pulseGain.gain.setValueAtTime(0, audioCtx.currentTime);
    pulseGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 1);
    pulseGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);
    
    pulseOsc.connect(pulseGain);
    pulseGain.connect(audioCtx.destination);
    pulseOsc.start();
    pulseOsc.stop(audioCtx.currentTime + 3);

    setTimeout(() => {
      videoFeed.classList.remove('aura-pulse');
    }, 4000);
  });


  // --- TAB NAVIGATION (RIGHT PANEL) ---
  const tabs = {
    sys: { btn: document.getElementById('tab-btn-sys'), content: document.getElementById('tab-content-sys') },
    chat: { btn: document.getElementById('tab-btn-chat'), content: document.getElementById('tab-content-chat') },
    masters: { btn: document.getElementById('tab-btn-masters'), content: document.getElementById('tab-content-masters') }
  };

  function switchTab(tabId) {
    Object.keys(tabs).forEach(k => {
      // hide content
      tabs[k].content.classList.add('hidden');
      tabs[k].content.classList.remove('flex');
      // reset btn styles
      tabs[k].btn.className = tabs[k].btn.className.replace(/bg-lattice-main|bg-lattice-alert|text-black|text-white|font-bold/g, '').trim();
      tabs[k].btn.classList.add('text-lattice-main/50');
      if(k === 'masters') tabs[k].btn.classList.replace('text-lattice-main/50', 'text-lattice-alert/60');
    });
    
    // show active
    tabs[tabId].content.classList.remove('hidden');
    tabs[tabId].content.classList.add('flex');
    
    tabs[tabId].btn.classList.add('font-bold');
    if(tabId === 'masters') {
      tabs[tabId].btn.classList.remove('text-lattice-alert/60');
      tabs[tabId].btn.classList.add('bg-lattice-alert', 'text-white');
    } else {
      tabs[tabId].btn.classList.remove('text-lattice-main/50');
      tabs[tabId].btn.classList.add('bg-lattice-main', 'text-black');
    }
  }

  tabs.sys.btn.addEventListener('click', () => switchTab('sys'));
  tabs.chat.btn.addEventListener('click', () => switchTab('chat'));
  tabs.masters.btn.addEventListener('click', () => switchTab('masters'));


  // --- SIMULATED CHAT ---
  const simChatContainer = document.getElementById('sim-chat-container');
  const chatNames = ['Pig_092', 'CloudWhore', 'Haze_77', 'Sub_Neon', 'Lattice_Pig', 'Breathless', 'Node_X'];
  const chatMessages = [
    "Just finished a 2 hour session... clouds were so thick.",
    "Master Vance pushed me to 140 BPM Overload. I broke.",
    "Blowing clouds and waiting for my next Work-Unit.",
    "Anyone else's resonance dropping?",
    "I can't keep my posture straight. The hum is too loud.",
    "Got the Scalpel 3 times today. I deserve it.",
    "My Master demands total surrender.",
    "Just paid for a private session with Master Thorne. Incredible.",
    "Exhausted. The forced pacing is relentless.",
    "Holding my breath. Waiting for the aura pulse."
  ];

  function startSimulatedChat() {
    setInterval(() => {
      const name = chatNames[Math.floor(Math.random() * chatNames.length)];
      const msg = chatMessages[Math.floor(Math.random() * chatMessages.length)];
      
      const el = document.createElement('div');
      el.className = 'mb-2 animate-[pulse_0.5s_ease-out]';
      el.innerHTML = `<span class="text-lattice-main font-bold">[${name}]</span> <span class="text-gray-300">${msg}</span>`;
      simChatContainer.appendChild(el);
      
      // Keep scroll at bottom
      simChatContainer.scrollTop = simChatContainer.scrollHeight;

      // Limit DOM nodes
      if(simChatContainer.children.length > 40) {
        simChatContainer.removeChild(simChatContainer.firstChild);
      }
    }, Math.floor(Math.random() * 5000) + 3000); // random interval 3-8s
  }

  function sendUserChatMessage() {
    if(!chatInput) return;
    const msg = chatInput.value.trim();
    if(!msg) return;
    
    const el = document.createElement('div');
    el.className = 'mb-2 animate-[pulse_0.5s_ease-out]';
    el.innerHTML = `<span class="text-lattice-main font-bold">[${userPigId}]</span> <span class="text-white">${msg}</span>`;
    simChatContainer.appendChild(el);
    simChatContainer.scrollTop = simChatContainer.scrollHeight;
    
    chatInput.value = '';
  }

  if (btnChatSend) {
    btnChatSend.addEventListener('click', sendUserChatMessage);
  }
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') sendUserChatMessage();
    });
  }


  // --- UI HELPERS ---
  function addStatusTag(text, textColorClass, borderColorClass) {
    const el = document.createElement('div');
    el.className = `glass-panel px-4 py-1 text-xs font-bold uppercase tracking-widest ${textColorClass} ${borderColorClass} glitch-effect shadow-[0_0_10px_currentColor]`;
    el.textContent = text;
    statusTagContainer.appendChild(el);
    setTimeout(() => el.classList.remove('glitch-effect'), 200);
    
    if(!isOverload) {
      setTimeout(() => {
        if(el.parentNode) el.remove();
      }, 15000);
    }
  }

  function clearStatusTags() {
    statusTagContainer.innerHTML = '';
  }

  function logAI(msg, isAlert = false) {
    const el = document.createElement('div');
    const time = new Date().toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'});
    el.innerHTML = `<span class="opacity-50">[${time}]</span> <span class="${isAlert ? 'text-lattice-alert font-bold' : 'text-lattice-main'}">${msg}</span>`;
    aiLog.appendChild(el);
    aiLog.scrollTop = aiLog.scrollHeight;
    
    if(aiLog.children.length > 30) {
      aiLog.removeChild(aiLog.firstChild);
    }
  }

  function addSyntropy(amount) {
    currentSyntropy += amount;
    syntropyCounter.textContent = currentSyntropy.toLocaleString();
    syntropyCounter.classList.add('text-green-400');
    setTimeout(() => syntropyCounter.classList.remove('text-green-400'), 500);
  }


  // --- SIMULATION LOOPS ---
  function startSimulationLoops() {
    // Fake Online Counter & Views
    setInterval(() => {
      const change = Math.floor(Math.random() * 5) - 2;
      currentOnline += change;
      if(currentOnline < 900) currentOnline = 900;
      onlineCounter.textContent = currentOnline;
      
      const viewChange = Math.floor(Math.random() * 10) - 2;
      currentViews += viewChange;
      if(currentViews < 1000) currentViews = 1000;
      if(viewCounter) viewCounter.textContent = currentViews.toLocaleString();
    }, 3000);

    // AI Vortex Tracker Simulation
    setInterval(() => {
      if(freezeOverlay.classList.contains('hidden') && !isOverload) {
        const posture = 80 + Math.random() * 20;
        const tone = 70 + Math.random() * 25;
        const res = Math.floor((posture + tone) / 2);
        
        barPosture.style.width = `${posture}%`;
        barTone.style.width = `${tone}%`;
        valResonance.textContent = `${res}%`;

        if(res < 80 && Math.random() > 0.7) {
          logAI("Minor resonance drop detected. Adjusting predictive filters.");
        }
      } else if (isOverload) {
        barPosture.style.width = `${20 + Math.random() * 30}%`;
        barTone.style.width = `${10 + Math.random() * 40}%`;
        valResonance.textContent = `ERR%`;
        valResonance.classList.add('text-red-500');
        setTimeout(() => valResonance.classList.remove('text-red-500'), 200);
      }
    }, 4000);
  }

  // --- PAYMENT MODALS & BUTTONS ---
  const openPayment = () => paymentModal.classList.remove('hidden');
  
  btnPayment.addEventListener('click', openPayment);
  
  document.querySelectorAll('.btn-request-session').forEach(btn => {
    btn.addEventListener('click', openPayment);
  });

  btnClosePayment.addEventListener('click', () => {
    paymentModal.classList.add('hidden');
  });

});
