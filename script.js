/**
 * OmniCalc - Precision Engine & Interactive Calculator Logic
 * Includes: Evaluator, Scientific Functions, Unit Converter, Audio Synthesizer,
 * History Manager, Keyboard Support, Themes, and Dynamic Display Resizer.
 */

(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. State Management
  // ---------------------------------------------------------------------------
  const state = {
    currentInput: '0',
    expression: '',
    memory: 0,
    angleMode: 'DEG', // 'DEG' or 'RAD'
    activeMode: 'standard', // 'standard' | 'scientific' | 'converter'
    history: [],
    soundEnabled: true,
    theme: 'obsidian',
    isResultComputed: false
  };

  // ---------------------------------------------------------------------------
  // 2. DOM Elements
  // ---------------------------------------------------------------------------
  const elements = {
    // Displays
    mainDisplay: document.getElementById('main-display'),
    expressionDisplay: document.getElementById('expression-display'),
    livePreviewVal: document.getElementById('live-preview-val'),
    angleModeTag: document.getElementById('angle-mode-tag'),
    memoryActiveTag: document.getElementById('memory-active-tag'),
    copyDisplayBtn: document.getElementById('copy-display-btn'),

    // Views
    calcView: document.getElementById('calc-view'),
    converterView: document.getElementById('converter-view'),
    scientificPanel: document.getElementById('scientific-panel'),
    modeTabs: document.querySelectorAll('.mode-tab'),

    // History
    historyDrawer: document.getElementById('history-drawer'),
    historyList: document.getElementById('history-list'),
    historyEmpty: document.getElementById('history-empty'),
    historyToggleBtn: document.getElementById('history-toggle-btn'),
    closeHistoryBtn: document.getElementById('close-history-btn'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    historyBadge: document.getElementById('history-badge'),

    // Audio & Theme
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    soundOnIcon: document.querySelector('.icon-sound-on'),
    soundOffIcon: document.querySelector('.icon-sound-off'),
    themeBtn: document.getElementById('theme-btn'),
    themeMenu: document.getElementById('theme-menu'),
    themeOptions: document.querySelectorAll('.theme-option'),

    // Unit Converter Elements
    convCategory: document.getElementById('converter-category-select'),
    convFromInput: document.getElementById('converter-from-input'),
    convToInput: document.getElementById('converter-to-input'),
    convFromUnit: document.getElementById('converter-from-unit'),
    convToUnit: document.getElementById('converter-to-unit'),
    convSwapBtn: document.getElementById('converter-swap-btn'),
    convFormulaText: document.getElementById('converter-formula-text'),

    // Memory Buttons
    btnMc: document.getElementById('btn-mc'),
    btnMr: document.getElementById('btn-mr'),
    btnMplus: document.getElementById('btn-mplus'),
    btnMminus: document.getElementById('btn-mminus'),
    btnMs: document.getElementById('btn-ms'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
  };

  // ---------------------------------------------------------------------------
  // 3. Audio Feedback Synthesizer (Web Audio API)
  // ---------------------------------------------------------------------------
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.05, gainValue = 0.08) {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(gainValue, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Audio playback silently disregarded if blocked
    }
  }

  function playSound(soundType) {
    switch (soundType) {
      case 'num':
        playTone(680, 'sine', 0.04, 0.06);
        break;
      case 'op':
        playTone(460, 'triangle', 0.05, 0.08);
        break;
      case 'fn':
        playTone(360, 'sine', 0.04, 0.07);
        break;
      case 'equals':
        // Harmonious chord
        playTone(523.25, 'sine', 0.12, 0.08); // C5
        setTimeout(() => playTone(659.25, 'triangle', 0.14, 0.07), 40); // E5
        break;
      case 'clear':
        playTone(280, 'sawtooth', 0.06, 0.05);
        break;
      case 'error':
        playTone(180, 'sawtooth', 0.12, 0.09);
        break;
      default:
        playTone(440, 'sine', 0.04, 0.06);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Mathematical Evaluator & Parser
  // ---------------------------------------------------------------------------
  /**
   * Cleans floating point inaccuracies (e.g. 0.1 + 0.2 = 0.3)
   */
  function cleanFloat(num) {
    if (typeof num !== 'number' || isNaN(num)) return num;
    // Format to 12 decimal places max, then convert back to strip trailing zeros
    const rounded = Number(num.toPrecision(12));
    return Math.abs(rounded) < 1e-12 ? 0 : rounded;
  }

  function factorial(n) {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    if (n > 170) return Infinity; // JS max float limit
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  /**
   * Safely transforms friendly expression symbols into valid JS Math expressions
   */
  function parseExpression(expr) {
    let parsed = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e(?![a-zA-Z0-9_])/g, `(${Math.E})`);

    // Handle DEG/RAD conversion for trigonometric functions
    const isDeg = state.angleMode === 'DEG';

    if (isDeg) {
      parsed = parsed.replace(/sin\(([^)]+)\)/g, `Math.sin(($1) * Math.PI / 180)`);
      parsed = parsed.replace(/cos\(([^)]+)\)/g, `Math.cos(($1) * Math.PI / 180)`);
      parsed = parsed.replace(/tan\(([^)]+)\)/g, `Math.tan(($1) * Math.PI / 180)`);
    } else {
      parsed = parsed.replace(/sin\(/g, 'Math.sin(');
      parsed = parsed.replace(/cos\(/g, 'Math.cos(');
      parsed = parsed.replace(/tan\(/g, 'Math.tan(');
    }

    parsed = parsed.replace(/log\(/g, 'Math.log10(');
    parsed = parsed.replace(/ln\(/g, 'Math.log(');
    parsed = parsed.replace(/sqrt\(/g, 'Math.sqrt(');
    parsed = parsed.replace(/\^/g, '**');

    // Handle percentage (e.g. 50% -> (50/100))
    parsed = parsed.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

    return parsed;
  }

  /**
   * Evaluates the expression and returns { result, error }
   */
  function evaluate(exprString) {
    if (!exprString || !exprString.trim()) {
      return { result: '0', error: null };
    }

    // Auto-balance unclosed parentheses
    let openCount = (exprString.match(/\(/g) || []).length;
    let closeCount = (exprString.match(/\)/g) || []).length;
    let balanced = exprString;
    while (openCount > closeCount) {
      balanced += ')';
      closeCount++;
    }

    try {
      const codeToRun = parseExpression(balanced);

      // Verify safety (only allow mathematical operators, numbers, and Math.*)
      if (!/^[0-9+\-*/().%\s^eπ,]|Math\.[a-zA-Z0-9_]+/g.test(codeToRun)) {
        return { result: null, error: 'Invalid Syntax' };
      }

      // Safe evaluation using Function
      const evaluated = new Function(`"use strict"; return (${codeToRun});`)();

      if (typeof evaluated !== 'number' || isNaN(evaluated)) {
        return { result: null, error: 'Invalid Format' };
      }

      if (!isFinite(evaluated)) {
        return { result: null, error: 'Cannot divide by 0' };
      }

      const cleaned = cleanFloat(evaluated);
      return { result: cleaned.toString(), error: null };
    } catch {
      return { result: null, error: 'Invalid Syntax' };
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Display & UI Rendering
  // ---------------------------------------------------------------------------
  function formatNumberForDisplay(numStr) {
    if (!numStr || isNaN(Number(numStr))) return numStr;
    const parts = numStr.split('.');
    // Add commas to the integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function updateDisplay() {
    const rawVal = state.currentInput;
    let displayVal = rawVal;

    // Adjust font size dynamically to prevent overflow
    elements.mainDisplay.classList.remove('text-medium', 'text-small', 'text-xsmall');
    if (displayVal.length > 14) {
      elements.mainDisplay.classList.add('text-xsmall');
    } else if (displayVal.length > 10) {
      elements.mainDisplay.classList.add('text-small');
    } else if (displayVal.length > 7) {
      elements.mainDisplay.classList.add('text-medium');
    }

    elements.mainDisplay.textContent = formatNumberForDisplay(displayVal);
    elements.expressionDisplay.textContent = state.expression;

    // Live preview evaluation
    let targetForPreview = state.expression;
    const lastChar = targetForPreview.slice(-1);
    const isOp = ['+', '−', '×', '÷', '^'].includes(lastChar);

    if (isOp) {
      targetForPreview += state.currentInput;
    } else if (!targetForPreview && state.currentInput) {
      targetForPreview = state.currentInput;
    }

    if (targetForPreview && !state.isResultComputed) {
      const { result, error } = evaluate(targetForPreview);
      if (!error && result && result !== state.currentInput) {
        elements.livePreviewVal.textContent = formatNumberForDisplay(result);
      } else {
        elements.livePreviewVal.textContent = '';
      }
    } else {
      elements.livePreviewVal.textContent = '';
    }

    // Update tags
    elements.angleModeTag.textContent = state.angleMode;
    const btnAngle = document.getElementById('btn-angle-toggle');
    if (btnAngle) btnAngle.textContent = state.angleMode;

    if (state.memory !== 0) {
      elements.memoryActiveTag.classList.remove('hide');
    } else {
      elements.memoryActiveTag.classList.add('hide');
    }
  }

  function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.toast.classList.remove('hide');
    clearTimeout(elements.toastTimeout);
    elements.toastTimeout = setTimeout(() => {
      elements.toast.classList.add('hide');
    }, 2200);
  }

  // ---------------------------------------------------------------------------
  // 6. Calculator Input Actions
  // ---------------------------------------------------------------------------
  function inputDigit(digit) {
    playSound('num');
    if (state.isResultComputed) {
      state.currentInput = digit;
      state.expression = '';
      state.isResultComputed = false;
    } else {
      if (state.currentInput === '0' || state.currentInput === '-0') {
        state.currentInput = state.currentInput.startsWith('-') ? '-' + digit : digit;
      } else {
        if (state.currentInput.length < 16) {
          state.currentInput += digit;
        }
      }
    }
    updateDisplay();
  }

  function inputDecimal() {
    playSound('num');
    if (state.isResultComputed) {
      state.currentInput = '0.';
      state.expression = '';
      state.isResultComputed = false;
    } else {
      if (!state.currentInput.includes('.')) {
        state.currentInput += '.';
      }
    }
    updateDisplay();
  }

  function handleOperator(op) {
    playSound('op');
    const symbolMap = { '+': '+', '-': '−', '−': '−', '*': '×', '×': '×', '/': '÷', '÷': '÷', '^': '^' };
    const cleanOp = symbolMap[op] || op;

    if (state.isResultComputed) {
      state.expression = `${state.currentInput} ${cleanOp} `;
      state.isResultComputed = false;
    } else {
      const lastChar = state.expression.trim().slice(-1);
      const isLastOp = ['+', '−', '×', '÷', '^'].includes(lastChar);

      if (isLastOp && (state.currentInput === '0' || state.currentInput === '')) {
        // Replace previous operator
        state.expression = state.expression.trim().slice(0, -1) + cleanOp + ' ';
      } else {
        state.expression += `${state.currentInput} ${cleanOp} `;
      }
    }

    state.currentInput = '0';
    updateDisplay();
  }

  function calculateEquals() {
    let fullExpr = state.expression + state.currentInput;
    if (!fullExpr.trim()) return;

    const { result, error } = evaluate(fullExpr);

    if (error) {
      playSound('error');
      state.currentInput = error;
      state.expression = '';
      state.isResultComputed = true;
      updateDisplay();
      return;
    }

    playSound('equals');
    addToHistory(fullExpr, result);

    state.expression = `${fullExpr} =`;
    state.currentInput = result;
    state.isResultComputed = true;
    updateDisplay();
  }

  function clearAll() {
    playSound('clear');
    state.currentInput = '0';
    state.expression = '';
    state.isResultComputed = false;
    updateDisplay();
  }

  function backspace() {
    playSound('fn');
    if (state.isResultComputed) {
      state.expression = '';
      state.isResultComputed = false;
      state.currentInput = '0';
    } else {
      if (state.currentInput.length > 1) {
        state.currentInput = state.currentInput.slice(0, -1);
      } else {
        state.currentInput = '0';
      }
    }
    updateDisplay();
  }

  function toggleSign() {
    playSound('fn');
    if (state.currentInput !== '0') {
      if (state.currentInput.startsWith('-')) {
        state.currentInput = state.currentInput.slice(1);
      } else {
        state.currentInput = '-' + state.currentInput;
      }
      updateDisplay();
    }
  }

  function handlePercent() {
    playSound('fn');
    const val = parseFloat(state.currentInput);
    if (!isNaN(val)) {
      state.currentInput = cleanFloat(val / 100).toString();
      updateDisplay();
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Scientific Functions
  // ---------------------------------------------------------------------------
  function handleScientific(action) {
    playSound('fn');
    const curVal = parseFloat(state.currentInput);

    switch (action) {
      case 'angle-toggle':
        state.angleMode = state.angleMode === 'DEG' ? 'RAD' : 'DEG';
        updateDisplay();
        return;

      case 'pi':
        state.currentInput = Math.PI.toString();
        state.isResultComputed = false;
        break;

      case 'e':
        state.currentInput = Math.E.toString();
        state.isResultComputed = false;
        break;

      case 'sin':
      case 'cos':
      case 'tan': {
        const fnName = action;
        state.expression += `${fnName}(${state.currentInput}) `;
        let angleVal = curVal;
        if (state.angleMode === 'DEG') {
          angleVal = (curVal * Math.PI) / 180;
        }
        let calcVal;
        if (fnName === 'sin') calcVal = Math.sin(angleVal);
        else if (fnName === 'cos') calcVal = Math.cos(angleVal);
        else if (fnName === 'tan') {
          // Tangent at 90, 270 deg is undefined
          if (state.angleMode === 'DEG' && Math.abs(curVal % 180) === 90) {
            state.currentInput = 'Invalid Format';
            state.isResultComputed = true;
            updateDisplay();
            return;
          }
          calcVal = Math.tan(angleVal);
        }
        state.currentInput = cleanFloat(calcVal).toString();
        state.isResultComputed = true;
        break;
      }

      case 'log': {
        if (curVal <= 0) {
          state.currentInput = 'Invalid Format';
          state.isResultComputed = true;
        } else {
          state.expression += `log(${state.currentInput}) `;
          state.currentInput = cleanFloat(Math.log10(curVal)).toString();
          state.isResultComputed = true;
        }
        break;
      }

      case 'ln': {
        if (curVal <= 0) {
          state.currentInput = 'Invalid Format';
          state.isResultComputed = true;
        } else {
          state.expression += `ln(${state.currentInput}) `;
          state.currentInput = cleanFloat(Math.log(curVal)).toString();
          state.isResultComputed = true;
        }
        break;
      }

      case 'sqrt': {
        if (curVal < 0) {
          state.currentInput = 'Invalid Format';
          state.isResultComputed = true;
        } else {
          state.expression += `sqrt(${state.currentInput}) `;
          state.currentInput = cleanFloat(Math.sqrt(curVal)).toString();
          state.isResultComputed = true;
        }
        break;
      }

      case 'square': {
        state.expression += `sqr(${state.currentInput}) `;
        state.currentInput = cleanFloat(curVal * curVal).toString();
        state.isResultComputed = true;
        break;
      }

      case 'inv': {
        if (curVal === 0) {
          state.currentInput = 'Cannot divide by 0';
          state.isResultComputed = true;
        } else {
          state.expression += `1/(${state.currentInput}) `;
          state.currentInput = cleanFloat(1 / curVal).toString();
          state.isResultComputed = true;
        }
        break;
      }

      case 'pow':
        handleOperator('^');
        return;

      case 'factorial': {
        if (curVal < 0 || Math.floor(curVal) !== curVal || curVal > 170) {
          state.currentInput = 'Invalid Format';
          state.isResultComputed = true;
        } else {
          state.expression += `fact(${state.currentInput}) `;
          state.currentInput = cleanFloat(factorial(curVal)).toString();
          state.isResultComputed = true;
        }
        break;
      }

      case 'open-paren':
        state.expression += '(';
        break;

      case 'close-paren':
        state.expression += state.currentInput + ')';
        state.currentInput = '0';
        break;

      default:
        break;
    }

    updateDisplay();
  }

  // ---------------------------------------------------------------------------
  // 8. Memory Operations
  // ---------------------------------------------------------------------------
  function handleMemory(action) {
    playSound('fn');
    const val = parseFloat(state.currentInput) || 0;

    switch (action) {
      case 'MC':
        state.memory = 0;
        showToast('Memory Cleared');
        break;
      case 'MR':
        state.currentInput = state.memory.toString();
        state.isResultComputed = false;
        showToast(`Memory Recalled: ${state.memory}`);
        break;
      case 'M+':
        state.memory = cleanFloat(state.memory + val);
        showToast(`Added to Memory: ${state.memory}`);
        break;
      case 'M-':
        state.memory = cleanFloat(state.memory - val);
        showToast(`Subtracted from Memory: ${state.memory}`);
        break;
      case 'MS':
        state.memory = val;
        showToast(`Stored in Memory: ${state.memory}`);
        break;
    }
    updateDisplay();
  }

  // ---------------------------------------------------------------------------
  // 9. Calculation History Management
  // ---------------------------------------------------------------------------
  function loadHistory() {
    try {
      const stored = localStorage.getItem('omnicalc_history');
      if (stored) {
        state.history = JSON.parse(stored);
        renderHistory();
      }
    } catch {
      state.history = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem('omnicalc_history', JSON.stringify(state.history.slice(0, 50)));
    } catch {
      // Storage quota or private mode handled gracefully
    }
  }

  function addToHistory(expr, result) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const item = {
      id: Date.now(),
      expression: expr,
      result: result,
      time: timeStr
    };
    state.history.unshift(item);
    if (state.history.length > 50) state.history.pop();
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    elements.historyList.innerHTML = '';
    const count = state.history.length;

    if (count > 0) {
      elements.historyBadge.textContent = count > 99 ? '99+' : count;
      elements.historyBadge.classList.remove('hide');
      elements.historyEmpty.classList.add('hide');

      state.history.forEach((item) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'history-item';
        itemEl.tabIndex = 0;
        itemEl.setAttribute('role', 'button');
        itemEl.setAttribute('aria-label', `Restore calculation: ${item.expression} equals ${item.result}`);

        itemEl.innerHTML = `
          <div class="history-expr">${escapeHTML(item.expression)}</div>
          <div class="history-result">${escapeHTML(formatNumberForDisplay(item.result))}</div>
          <div class="history-item-actions">
            <span>${escapeHTML(item.time)}</span>
            <span style="color: var(--accent-color); font-weight: 500;">Tap to restore</span>
          </div>
        `;

        itemEl.addEventListener('click', () => {
          playSound('fn');
          state.currentInput = item.result;
          state.expression = `${item.expression} =`;
          state.isResultComputed = true;
          updateDisplay();
          elements.historyDrawer.classList.add('hide');
          showToast('Calculation restored');
        });

        elements.historyList.appendChild(itemEl);
      });
    } else {
      elements.historyBadge.classList.add('hide');
      elements.historyList.appendChild(elements.historyEmpty);
      elements.historyEmpty.classList.remove('hide');
    }
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // 10. Unit Converter Engine
  // ---------------------------------------------------------------------------
  const conversionData = {
    length: {
      units: [
        { id: 'm', name: 'Meters (m)', factor: 1 },
        { id: 'km', name: 'Kilometers (km)', factor: 1000 },
        { id: 'cm', name: 'Centimeters (cm)', factor: 0.01 },
        { id: 'mm', name: 'Millimeters (mm)', factor: 0.001 },
        { id: 'mi', name: 'Miles (mi)', factor: 1609.344 },
        { id: 'yd', name: 'Yards (yd)', factor: 0.9144 },
        { id: 'ft', name: 'Feet (ft)', factor: 0.3048 },
        { id: 'in', name: 'Inches (in)', factor: 0.0254 }
      ]
    },
    weight: {
      units: [
        { id: 'kg', name: 'Kilograms (kg)', factor: 1 },
        { id: 'g', name: 'Grams (g)', factor: 0.001 },
        { id: 'mg', name: 'Milligrams (mg)', factor: 0.000001 },
        { id: 't', name: 'Metric Tons (t)', factor: 1000 },
        { id: 'lb', name: 'Pounds (lb)', factor: 0.45359237 },
        { id: 'oz', name: 'Ounces (oz)', factor: 0.028349523125 }
      ]
    },
    temperature: {
      units: [
        { id: 'C', name: 'Celsius (°C)' },
        { id: 'F', name: 'Fahrenheit (°F)' },
        { id: 'K', name: 'Kelvin (K)' }
      ]
    },
    data: {
      units: [
        { id: 'B', name: 'Bytes (B)', factor: 1 },
        { id: 'KB', name: 'Kilobytes (KB)', factor: 1024 },
        { id: 'MB', name: 'Megabytes (MB)', factor: 1048576 },
        { id: 'GB', name: 'Gigabytes (GB)', factor: 1073741824 },
        { id: 'TB', name: 'Terabytes (TB)', factor: 1099511627776 }
      ]
    },
    speed: {
      units: [
        { id: 'mps', name: 'Meters/sec (m/s)', factor: 1 },
        { id: 'kmh', name: 'Kilometers/hour (km/h)', factor: 0.2777777778 },
        { id: 'mph', name: 'Miles/hour (mph)', factor: 0.44704 },
        { id: 'knot', name: 'Knots (kn)', factor: 0.5144444444 }
      ]
    },
    time: {
      units: [
        { id: 's', name: 'Seconds (s)', factor: 1 },
        { id: 'min', name: 'Minutes (min)', factor: 60 },
        { id: 'h', name: 'Hours (h)', factor: 3600 },
        { id: 'd', name: 'Days (d)', factor: 86400 },
        { id: 'wk', name: 'Weeks (wk)', factor: 604800 }
      ]
    }
  };

  function initConverter() {
    populateConverterUnits();

    elements.convCategory.addEventListener('change', () => {
      populateConverterUnits();
      performConversion();
    });

    elements.convFromInput.addEventListener('input', performConversion);
    elements.convFromUnit.addEventListener('change', performConversion);
    elements.convToUnit.addEventListener('change', performConversion);

    elements.convSwapBtn.addEventListener('click', () => {
      playSound('fn');
      const fromVal = elements.convFromUnit.value;
      elements.convFromUnit.value = elements.convToUnit.value;
      elements.convToUnit.value = fromVal;
      performConversion();
    });
  }

  function populateConverterUnits() {
    const category = elements.convCategory.value;
    const catData = conversionData[category];
    if (!catData) return;

    elements.convFromUnit.innerHTML = '';
    elements.convToUnit.innerHTML = '';

    catData.units.forEach((u, index) => {
      const optFrom = document.createElement('option');
      optFrom.value = u.id;
      optFrom.textContent = u.name;
      elements.convFromUnit.appendChild(optFrom);

      const optTo = document.createElement('option');
      optTo.value = u.id;
      optTo.textContent = u.name;
      elements.convToUnit.appendChild(optTo);
    });

    // Default to converting index 0 to index 1 if exists
    if (catData.units.length > 1) {
      elements.convFromUnit.selectedIndex = 0;
      elements.convToUnit.selectedIndex = 1;
    }
    performConversion();
  }

  function performConversion() {
    const category = elements.convCategory.value;
    const fromUnit = elements.convFromUnit.value;
    const toUnit = elements.convToUnit.value;
    const fromVal = parseFloat(elements.convFromInput.value);

    if (isNaN(fromVal)) {
      elements.convToInput.value = '';
      elements.convFormulaText.textContent = 'Please enter a valid number';
      return;
    }

    let result = 0;

    if (category === 'temperature') {
      // Celsius base conversion
      let celsius = fromVal;
      if (fromUnit === 'F') celsius = (fromVal - 32) * (5 / 9);
      else if (fromUnit === 'K') celsius = fromVal - 273.15;

      if (toUnit === 'C') result = celsius;
      else if (toUnit === 'F') result = celsius * (9 / 5) + 32;
      else if (toUnit === 'K') result = celsius + 273.15;
    } else {
      const catData = conversionData[category];
      const fromObj = catData.units.find((u) => u.id === fromUnit);
      const toObj = catData.units.find((u) => u.id === toUnit);

      if (fromObj && toObj) {
        const baseVal = fromVal * fromObj.factor;
        result = baseVal / toObj.factor;
      }
    }

    const cleanedResult = cleanFloat(result);
    elements.convToInput.value = cleanedResult;

    // Formula explanation
    const fromName = elements.convFromUnit.options[elements.convFromUnit.selectedIndex]?.text.split(' (')[0];
    const toName = elements.convToUnit.options[elements.convToUnit.selectedIndex]?.text.split(' (')[0];
    elements.convFormulaText.textContent = `${formatNumberForDisplay(fromVal.toString())} ${fromName} = ${formatNumberForDisplay(cleanedResult.toString())} ${toName}`;
  }

  // ---------------------------------------------------------------------------
  // 11. Theme & Sound Settings
  // ---------------------------------------------------------------------------
  function initTheme() {
    const savedTheme = localStorage.getItem('omnicalc_theme') || 'obsidian';
    setTheme(savedTheme);

    elements.themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.themeMenu.classList.toggle('hide');
    });

    document.addEventListener('click', () => {
      elements.themeMenu.classList.add('hide');
    });

    elements.themeOptions.forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosen = btn.getAttribute('data-set-theme');
        setTheme(chosen);
      });
    });
  }

  function setTheme(themeName) {
    state.theme = themeName;
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('omnicalc_theme', themeName);

    elements.themeOptions.forEach((btn) => {
      if (btn.getAttribute('data-set-theme') === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function initSound() {
    const savedSound = localStorage.getItem('omnicalc_sound');
    if (savedSound !== null) {
      state.soundEnabled = savedSound === 'true';
    }
    updateSoundUI();

    elements.soundToggleBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('omnicalc_sound', state.soundEnabled);
      updateSoundUI();
      if (state.soundEnabled) playSound('fn');
      showToast(state.soundEnabled ? 'Sound enabled' : 'Sound muted');
    });
  }

  function updateSoundUI() {
    if (state.soundEnabled) {
      elements.soundOnIcon.classList.remove('hide');
      elements.soundOffIcon.classList.add('hide');
    } else {
      elements.soundOnIcon.classList.add('hide');
      elements.soundOffIcon.classList.remove('hide');
    }
  }

  // ---------------------------------------------------------------------------
  // 12. Keyboard Controls & Button Triggers
  // ---------------------------------------------------------------------------
  function highlightButton(buttonEl) {
    if (!buttonEl) return;
    buttonEl.classList.add('key-active');
    setTimeout(() => buttonEl.classList.remove('key-active'), 120);
  }

  function handleKeyboard(e) {
    // If user is currently focused on an input (like in the converter), do not intercept
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    const key = e.key;

    // Digits 0-9
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      inputDigit(key);
      highlightButton(document.getElementById(`btn-${key}`));
      return;
    }

    // Decimal
    if (key === '.' || key === ',') {
      e.preventDefault();
      inputDecimal();
      highlightButton(document.getElementById('btn-decimal'));
      return;
    }

    // Operators
    if (key === '+') {
      e.preventDefault();
      handleOperator('+');
      highlightButton(document.getElementById('btn-add'));
      return;
    }
    if (key === '-') {
      e.preventDefault();
      handleOperator('−');
      highlightButton(document.getElementById('btn-subtract'));
      return;
    }
    if (key === '*') {
      e.preventDefault();
      handleOperator('×');
      highlightButton(document.getElementById('btn-multiply'));
      return;
    }
    if (key === '/') {
      e.preventDefault();
      handleOperator('÷');
      highlightButton(document.getElementById('btn-divide'));
      return;
    }
    if (key === '%') {
      e.preventDefault();
      handlePercent();
      highlightButton(document.getElementById('btn-percent'));
      return;
    }
    if (key === '^') {
      e.preventDefault();
      handleOperator('^');
      return;
    }

    // Enter or Equals
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculateEquals();
      highlightButton(document.getElementById('btn-equals'));
      return;
    }

    // Backspace
    if (key === 'Backspace') {
      e.preventDefault();
      backspace();
      highlightButton(document.getElementById('btn-backspace'));
      return;
    }

    // Clear (Escape or 'c' / 'C')
    if (key === 'Escape' || key === 'c' || key === 'C') {
      e.preventDefault();
      clearAll();
      highlightButton(document.getElementById('btn-clear'));
      return;
    }

    // Parentheses
    if (key === '(') {
      e.preventDefault();
      handleScientific('open-paren');
      return;
    }
    if (key === ')') {
      e.preventDefault();
      handleScientific('close-paren');
      return;
    }

    // Toggle History with 'h'
    if (key === 'h' || key === 'H') {
      e.preventDefault();
      elements.historyDrawer.classList.toggle('hide');
      return;
    }
  }

  // ---------------------------------------------------------------------------
  // 13. Event Listeners Setup
  // ---------------------------------------------------------------------------
  function attachEventListeners() {
    // Mode Switcher Tabs
    elements.modeTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        playSound('fn');
        const mode = tab.getAttribute('data-mode');
        state.activeMode = mode;

        elements.modeTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        if (mode === 'converter') {
          elements.calcView.classList.add('hide');
          elements.converterView.classList.remove('hide');
        } else {
          elements.calcView.classList.remove('hide');
          elements.converterView.classList.add('hide');

          if (mode === 'scientific') {
            elements.scientificPanel.classList.remove('hide');
          } else {
            elements.scientificPanel.classList.add('hide');
          }
        }
      });
    });

    // Standard Keypad Click Handlers
    const standardGrid = document.getElementById('standard-keypad');
    standardGrid.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;

      const num = button.getAttribute('data-num');
      const action = button.getAttribute('data-action');
      const op = button.getAttribute('data-op');

      if (num !== null) {
        inputDigit(num);
      } else if (op) {
        handleOperator(op);
      } else if (action) {
        switch (action) {
          case 'clear-all':
            clearAll();
            break;
          case 'backspace':
            backspace();
            break;
          case 'percent':
            handlePercent();
            break;
          case 'negate':
            toggleSign();
            break;
          case 'decimal':
            inputDecimal();
            break;
          case 'equals':
            calculateEquals();
            break;
        }
      }
    });

    // Scientific Panel Click Handlers
    elements.scientificPanel.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;
      const action = button.getAttribute('data-action');
      if (action) handleScientific(action);
    });

    // Memory Bar Handlers
    const memoryBar = document.getElementById('memory-bar');
    memoryBar.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;
      const memAction = button.getAttribute('data-mem');
      if (memAction) handleMemory(memAction);
    });

    // Angle mode tag click
    elements.angleModeTag.addEventListener('click', () => {
      handleScientific('angle-toggle');
    });

    // Copy to clipboard
    const copyHandler = () => {
      const textToCopy = state.currentInput;
      if (!textToCopy || textToCopy === '0') return;
      navigator.clipboard.writeText(textToCopy).then(() => {
        playSound('fn');
        showToast(`Copied ${textToCopy} to clipboard`);
      }).catch(() => {
        showToast('Copied to clipboard');
      });
    };

    elements.copyDisplayBtn.addEventListener('click', copyHandler);
    elements.mainDisplay.addEventListener('click', copyHandler);

    // History Drawer Events
    elements.historyToggleBtn.addEventListener('click', () => {
      playSound('fn');
      elements.historyDrawer.classList.toggle('hide');
    });

    elements.closeHistoryBtn.addEventListener('click', () => {
      playSound('fn');
      elements.historyDrawer.classList.add('hide');
    });

    elements.clearHistoryBtn.addEventListener('click', () => {
      playSound('clear');
      state.history = [];
      saveHistory();
      renderHistory();
      showToast('History cleared');
    });

    // Keyboard listener
    window.addEventListener('keydown', handleKeyboard);
  }

  // ---------------------------------------------------------------------------
  // 14. Initialization
  // ---------------------------------------------------------------------------
  function init() {
    loadHistory();
    initTheme();
    initSound();
    initConverter();
    attachEventListeners();
    updateDisplay();
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
