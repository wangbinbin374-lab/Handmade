/**
 * Handmade Bread Baking PWA - Application Controller
 */

// Application State
const state = {
  activePanel: 'recipes',
  recipes: [],
  bakes: [],
  ingredientPrices: {}, // Key: ingredient name, Value: { price: Number, unitWeight: Number }
  activeBake: null, // Holds current fermentation process state
  timerInterval: null,
  isTimerRunning: false,
  selectedStars: 5,
  defaultIngredients: [
    { name: '高筋面粉', weight: 300, isFlour: true },
    { name: '水', weight: 200, isFlour: false },
    { name: '干酵母', weight: 3, isFlour: false },
    { name: '盐', weight: 6, isFlour: false },
    { name: '细砂糖', weight: 15, isFlour: false },
    { name: '无盐黄油', weight: 24, isFlour: false }
  ]
};

// Default prices per kg/1000g
const DEFAULT_PRICES = {
  '高筋面粉': 12, // ¥12 / kg
  '水': 0.1,      // ¥0.1 / kg
  '干酵母': 80,    // ¥80 / kg (i.e. ¥8 for 100g)
  '盐': 5,        // ¥5 / kg
  '细砂糖': 10,    // ¥10 / kg
  '无盐黄油': 90   // ¥90 / kg (i.e. ¥45 for 500g)
};

// UI Elements
const els = {
  navItems: document.querySelectorAll('.nav-item'),
  panels: document.querySelectorAll('.panel'),
  pageTitle: document.getElementById('page-title'),
  btnAddRecipe: document.getElementById('btn-add-recipe'),
  btnEmptyAdd: document.getElementById('btn-empty-add'),
  recipeListContainer: document.getElementById('recipe-list-container'),
  
  // Sheet: Recipe editor
  sheetRecipe: document.getElementById('sheet-recipe'),
  btnRecipeCancel: document.getElementById('btn-recipe-cancel'),
  btnRecipeSave: document.getElementById('btn-recipe-save'),
  inputRecipeId: document.getElementById('input-recipe-id'),
  inputRecipeName: document.getElementById('input-recipe-name'),
  bakersTbody: document.getElementById('bakers-tbody'),
  btnAddIngredientRow: document.getElementById('btn-add-ingredient-row'),
  inputTimeBulk: document.getElementById('input-time-bulk'),
  inputTimeProof: document.getElementById('input-time-proof'),
  recipeSheetTitle: document.getElementById('recipe-sheet-title'),

  // Sheet: Recipe Details
  sheetRecipeDetail: document.getElementById('sheet-recipe-detail'),
  btnRecipeDetailBack: document.getElementById('btn-recipe-detail-back'),
  btnRecipeDetailEdit: document.getElementById('btn-recipe-detail-edit'),
  btnRecipeDelete: document.getElementById('btn-recipe-delete'),
  detailRecipeName: document.getElementById('detail-recipe-name'),
  detailIngredientsTbody: document.getElementById('detail-ingredients-tbody'),
  detailRecipeCost: document.getElementById('detail-recipe-cost'),
  selectRecipeScale: document.getElementById('select-recipe-scale'),
  btnStartRhythm: document.getElementById('btn-start-rhythm'),

  // Panel: Fermentation Rhythm
  noActiveBake: document.getElementById('no-active-bake'),
  btnGotoRecipes: document.getElementById('btn-goto-recipes'),
  activeBakeContainer: document.getElementById('active-bake-container'),
  activeBakeTitle: document.getElementById('active-bake-title'),
  activeBakeStepNum: document.getElementById('active-bake-step-num'),
  timerTime: document.getElementById('timer-time'),
  timerStepName: document.getElementById('timer-step-name'),
  btnTimerToggle: document.getElementById('btn-timer-toggle'),
  textTimerToggle: document.getElementById('text-timer-toggle'),
  iconPlay: document.getElementById('icon-play'),
  iconPause: document.getElementById('icon-pause'),
  btnTimerSkip: document.getElementById('btn-timer-skip'),
  activeTimeline: document.getElementById('active-timeline'),
  inputEnvTemp: document.getElementById('input-env-temp'),
  inputEnvHumidity: document.getElementById('input-env-humidity'),
  inputEnvNotes: document.getElementById('input-env-notes'),
  btnFinishBake: document.getElementById('btn-finish-bake'),

  // Sheet: Finish / Diary Camera
  sheetFinishBake: document.getElementById('sheet-finish-bake'),
  btnFinishCancel: document.getElementById('btn-finish-cancel'),
  btnFinishSave: document.getElementById('btn-finish-save'),
  photoCaptureArea: document.getElementById('photo-capture-area'),
  photoPreviewPlaceholder: document.getElementById('photo-preview-placeholder'),
  photoPreviewImg: document.getElementById('photo-preview-img'),
  cameraFileInput: document.getElementById('camera-file-input'),
  starsPickerContainer: document.getElementById('stars-picker-container'),
  inputFinishNotes: document.getElementById('input-finish-notes'),
  finishSummaryRecipe: document.getElementById('finish-summary-recipe'),
  finishSummaryCost: document.getElementById('finish-summary-cost'),
  finishSummaryDuration: document.getElementById('finish-summary-duration'),

  // Panel: Gallery
  diaryListContainer: document.getElementById('diary-list-container'),

  // Panel: Cost
  ingredientPricesContainer: document.getElementById('ingredient-prices-container'),
  btnSaveIngredientPrices: document.getElementById('btn-save-ingredient-prices'),

  // Settings
  settingAppName: document.getElementById('setting-app-name'),
  btnSaveAppName: document.getElementById('btn-save-app-name'),
  settingExport: document.getElementById('setting-export'),
  settingImportTrigger: document.getElementById('setting-import-trigger'),
  settingImportFile: document.getElementById('setting-import-file'),
  settingClear: document.getElementById('setting-clear'),

  // Custom Toast
  toastMsg: document.getElementById('toast-msg'),

  // Modals
  modalConfirm: document.getElementById('modal-confirm'),
  modalConfirmTitle: document.getElementById('modal-confirm-title'),
  modalConfirmText: document.getElementById('modal-confirm-text'),
  btnModalCancel: document.getElementById('btn-modal-cancel'),
  btnModalConfirm: document.getElementById('btn-modal-confirm')
};

// Modals confirmation state
let modalResolveCallback = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initDBAndLoadData();
  setupEventListeners();
  restoreActiveBakeState();
});

// --- NAVIGATION & TABS ---
function initNavbar() {
  els.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const panelId = item.getAttribute('data-panel');
      switchPanel(panelId);
    });
  });
}

function switchPanel(panelId) {
  state.activePanel = panelId;
  
  // Set navbar active class
  els.navItems.forEach(item => {
    if (item.getAttribute('data-panel') === panelId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Set panel active class
  els.panels.forEach(panel => {
    if (panel.id === `panel-${panelId}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Update headers / top bar actions
  if (panelId === 'recipes') {
    els.btnAddRecipe.style.display = 'flex';
    els.pageTitle.innerHTML = '手作配方 <span>🍞</span>';
  } else if (panelId === 'rhythm') {
    els.btnAddRecipe.style.display = 'none';
    els.pageTitle.innerHTML = '发酵节奏 <span>⏱️</span>';
    renderActiveBakeUI();
  } else if (panelId === 'gallery') {
    els.btnAddRecipe.style.display = 'none';
    els.pageTitle.innerHTML = '烘焙日记 <span>✨</span>';
    renderDiaryUI();
  } else if (panelId === 'cost') {
    els.btnAddRecipe.style.display = 'none';
    els.pageTitle.innerHTML = '单价库 <span>💰</span>';
    renderCostSettings();
  } else if (panelId === 'settings') {
    els.btnAddRecipe.style.display = 'none';
    els.pageTitle.innerHTML = '设置 <span>⚙️</span>';
  }
}

// --- DATABASE & APP STATE INITIALIZATION ---
function initDBAndLoadData() {
  window.HandmadeDB.getSetting('app_name', 'Handmade').then(name => {
    els.pageTitle.innerHTML = `${name} <span>🥖</span>`;
    els.settingAppName.value = name;
    document.title = name;
  });

  // Load Ingredient Prices first, fallback to DEFAULT_PRICES if empty
  window.HandmadeDB.getIngredients().then(prices => {
    if (prices.length === 0) {
      const defaultBatch = Object.keys(DEFAULT_PRICES).map(name => ({
        id: name,
        price: DEFAULT_PRICES[name]
      }));
      window.HandmadeDB.saveIngredientsBatch(defaultBatch).then(() => {
        defaultBatch.forEach(item => {
          state.ingredientPrices[item.id] = item.price;
        });
        loadRecipesAndDiary();
      });
    } else {
      prices.forEach(item => {
        state.ingredientPrices[item.id] = item.price;
      });
      loadRecipesAndDiary();
    }
  });
}

function loadRecipesAndDiary() {
  window.HandmadeDB.getRecipes().then(recipes => {
    state.recipes = recipes;
    renderRecipeList();
  });
  window.HandmadeDB.getBakes().then(bakes => {
    state.bakes = bakes;
    renderDiaryUI();
  });
}

// --- TOAST ALERTS & MODALS ---
function showToast(message) {
  els.toastMsg.innerText = message;
  els.toastMsg.classList.add('active');
  setTimeout(() => {
    els.toastMsg.classList.remove('active');
  }, 2500);
}

function showConfirmModal(title, text) {
  els.modalConfirmTitle.innerText = title;
  els.modalConfirmText.innerText = text;
  els.modalConfirm.classList.add('active');
  
  return new Promise((resolve) => {
    modalResolveCallback = resolve;
  });
}

// Modal actions
els.btnModalCancel.addEventListener('click', () => {
  els.modalConfirm.classList.remove('active');
  if (modalResolveCallback) modalResolveCallback(false);
});

els.btnModalConfirm.addEventListener('click', () => {
  els.modalConfirm.classList.remove('active');
  if (modalResolveCallback) modalResolveCallback(true);
});

// --- EVENT LISTENERS REGISTRATION ---
function setupEventListeners() {
  // Recipe Panel
  els.btnAddRecipe.addEventListener('click', () => openRecipeSheet());
  els.btnEmptyAdd.addEventListener('click', () => openRecipeSheet());
  els.btnRecipeCancel.addEventListener('click', () => closeRecipeSheet());
  els.btnRecipeSave.addEventListener('click', () => saveRecipe());
  els.btnAddIngredientRow.addEventListener('click', () => addIngredientInputRow('', 0, false));
  els.btnGotoRecipes.addEventListener('click', () => switchPanel('recipes'));

  // Recipe Details Panel
  els.btnRecipeDetailBack.addEventListener('click', () => {
    els.sheetRecipeDetail.classList.remove('active');
  });
  els.btnRecipeDetailEdit.addEventListener('click', () => {
    const recipeId = els.btnRecipeDetailEdit.getAttribute('data-id');
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (recipe) {
      els.sheetRecipeDetail.classList.remove('active');
      openRecipeSheet(recipe);
    }
  });
  els.btnRecipeDelete.addEventListener('click', () => {
    const recipeId = els.btnRecipeDetailEdit.getAttribute('data-id');
    showConfirmModal('删除配方？', '确认删除该配方吗？该操作无法恢复。').then(confirm => {
      if (confirm) {
        window.HandmadeDB.deleteRecipe(recipeId).then(() => {
          showToast('配方已删除 🗑️');
          els.sheetRecipeDetail.classList.remove('active');
          loadRecipesAndDiary();
        });
      }
    });
  });
  
  els.selectRecipeScale.addEventListener('change', () => {
    const recipeId = els.btnRecipeDetailEdit.getAttribute('data-id');
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (recipe) {
      renderRecipeDetailTable(recipe, parseFloat(els.selectRecipeScale.value));
    }
  });

  els.btnStartRhythm.addEventListener('click', () => {
    const recipeId = els.btnRecipeDetailEdit.getAttribute('data-id');
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (recipe) {
      startBakingProcess(recipe, parseFloat(els.selectRecipeScale.value));
    }
  });

  // Fermentation Timeline Active Panel
  els.btnTimerToggle.addEventListener('click', () => toggleTimer());
  els.btnTimerSkip.addEventListener('click', () => skipBakeStep());
  els.btnFinishBake.addEventListener('click', () => openFinishBakeSheet());

  // Finish Diary Sheet
  els.btnFinishCancel.addEventListener('click', () => {
    els.sheetFinishBake.classList.remove('active');
  });
  els.btnFinishSave.addEventListener('click', () => saveBakeDiary());
  els.photoCaptureArea.addEventListener('click', () => {
    els.cameraFileInput.click();
  });
  els.cameraFileInput.addEventListener('change', handlePhotoCapture);
  
  // Stars Picker
  const starSpans = els.starsPickerContainer.querySelectorAll('span');
  starSpans.forEach(span => {
    span.addEventListener('click', () => {
      const starVal = parseInt(span.getAttribute('data-star'));
      state.selectedStars = starVal;
      updateStarsUI(starVal);
    });
  });

  // Cost Panel
  els.btnSaveIngredientPrices.addEventListener('click', saveIngredientPrices);

  // Settings Panel
  els.btnSaveAppName.addEventListener('click', () => {
    const name = els.settingAppName.value.trim();
    if (name) {
      window.HandmadeDB.saveSetting('app_name', name).then(() => {
        showToast('设置已应用 🦄');
        els.pageTitle.innerHTML = `${name} <span>🥖</span>`;
        document.title = name;
      });
    }
  });

  els.settingExport.addEventListener('click', () => {
    window.HandmadeDB.exportBackup().then(jsonStr => {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `handmade_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('备份文件已下载 💾');
    });
  });

  els.settingImportTrigger.addEventListener('click', () => {
    els.settingImportFile.click();
  });
  els.settingImportFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      window.HandmadeDB.importBackup(event.target.result)
        .then(() => {
          showToast('数据恢复成功！🌱');
          initDBAndLoadData();
          els.settingImportFile.value = '';
        })
        .catch(err => {
          showToast('导入失败，请检查备份文件是否正确');
          console.error(err);
          els.settingImportFile.value = '';
        });
    };
    reader.readAsText(file);
  });

  els.settingClear.addEventListener('click', () => {
    showConfirmModal('确定清除所有数据？', '此操作将彻底删除所有配方、发酵日记，恢复默认价格库且不可撤销！')
      .then(confirm => {
        if (confirm) {
          window.HandmadeDB.clearAllData().then(() => {
            showToast('所有数据已清空 🍃');
            state.activeBake = null;
            localStorage.removeItem('activeBakeState');
            if (state.timerInterval) clearInterval(state.timerInterval);
            state.isTimerRunning = false;
            initDBAndLoadData();
            switchPanel('recipes');
          });
        }
      });
  });
}

// --- RECIPE ACTIONS & RENDERING ---
function renderRecipeList() {
  els.recipeListContainer.innerHTML = '';
  
  if (state.recipes.length === 0) {
    els.recipeListContainer.innerHTML = `
      <div class="glass-card text-center" style="padding: 40px 20px;">
        <p style="color: var(--text-muted); margin-bottom: 20px;">还没有添加面包配方哦~ 🍞</p>
        <button class="btn btn-primary" id="btn-empty-add-dyn">新建第一个配方</button>
      </div>
    `;
    document.getElementById('btn-empty-add-dyn').addEventListener('click', () => openRecipeSheet());
    return;
  }

  state.recipes.forEach(recipe => {
    const totalWeight = recipe.ingredients.reduce((sum, item) => sum + item.weight, 0);
    const flourWeight = recipe.ingredients.find(item => item.isFlour)?.weight || 100;
    const hydration = Math.round((recipe.ingredients.filter(item => !item.isFlour && (item.name.includes('水') || item.name.includes('奶') || item.name.includes('液') || item.name.includes('蛋'))).reduce((sum, i) => sum + i.weight, 0) / flourWeight) * 100) || 0;

    const card = document.createElement('div');
    card.className = 'glass-card recipe-card';
    card.innerHTML = `
      <div class="recipe-info">
        <h3>${recipe.name}</h3>
        <div class="recipe-stats">
          <div class="recipe-stat">
            <span>⚖️</span> 总重 ${totalWeight}g
          </div>
          <div class="recipe-stat">
            <span>💧</span> 水合 ${hydration}%
          </div>
          <div class="recipe-stat">
            <span>⏱️</span> 约 ${recipe.bulkTime + recipe.proofTime + 85}分钟
          </div>
        </div>
      </div>
      <button class="btn btn-circle" style="background: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.4);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    `;

    card.addEventListener('click', () => openRecipeDetailSheet(recipe));
    els.recipeListContainer.appendChild(card);
  });
}

function openRecipeSheet(recipe = null) {
  els.bakersTbody.innerHTML = '';
  
  if (recipe) {
    els.recipeSheetTitle.innerText = '编辑配方';
    els.inputRecipeId.value = recipe.id;
    els.inputRecipeName.value = recipe.name;
    els.inputTimeBulk.value = recipe.bulkTime;
    els.inputTimeProof.value = recipe.proofTime;
    
    recipe.ingredients.forEach(item => {
      addIngredientInputRow(item.name, item.weight, item.isFlour);
    });
  } else {
    els.recipeSheetTitle.innerText = '新建配方';
    els.inputRecipeId.value = '';
    els.inputRecipeName.value = '';
    els.inputTimeBulk.value = 60;
    els.inputTimeProof.value = 45;
    
    state.defaultIngredients.forEach(item => {
      addIngredientInputRow(item.name, item.weight, item.isFlour);
    });
  }
  
  updateBakersPercentages();
  els.sheetRecipe.classList.add('active');
}

function closeRecipeSheet() {
  els.sheetRecipe.classList.remove('active');
}

function addIngredientInputRow(name = '', weight = 0, isFlour = false) {
  const tr = document.createElement('tr');
  tr.className = isFlour ? 'flour-row' : 'ingredient-row';
  
  tr.innerHTML = `
    <td>
      <input type="text" class="glass-input ing-name" value="${name}" placeholder="原料" style="width: 100%; text-align: left; padding: 6px 8px;" ${isFlour ? 'readonly' : ''}>
    </td>
    <td>
      <input type="number" class="glass-input ing-weight" value="${weight || ''}" placeholder="0" step="any" style="padding: 6px 8px;">
    </td>
    <td class="percent-col">
      <span class="percentage-badge percent-display">${isFlour ? '100%' : '0%'}</span>
    </td>
  `;

  // Bind calculation events
  const weightInput = tr.querySelector('.ing-weight');
  weightInput.addEventListener('input', () => {
    if (isFlour) {
      // If reference flour weight changes, recalculate all other weights based on their active percentages
      recalculateWeightsFromFlour(parseFloat(weightInput.value) || 0);
    } else {
      // If regular weight changes, update its percentage
      updateBakersPercentages();
    }
  });

  els.bakersTbody.appendChild(tr);
  
  // Update percentages
  if (!isFlour) {
    updateBakersPercentages();
  }
}

function getFlourWeightFromEditor() {
  const flourRow = els.bakersTbody.querySelector('.flour-row');
  if (!flourRow) return 0;
  return parseFloat(flourRow.querySelector('.ing-weight').value) || 0;
}

function updateBakersPercentages() {
  const flourWeight = getFlourWeightFromEditor();
  if (flourWeight <= 0) return;

  const rows = els.bakersTbody.querySelectorAll('tr');
  rows.forEach(row => {
    const isFlour = row.classList.contains('flour-row');
    if (isFlour) return;

    const weight = parseFloat(row.querySelector('.ing-weight').value) || 0;
    const percentSpan = row.querySelector('.percent-display');
    
    const percentage = Math.round((weight / flourWeight) * 1000) / 10;
    percentSpan.innerText = `${percentage}%`;
  });
}

function recalculateWeightsFromFlour(newFlourWeight) {
  if (newFlourWeight <= 0) return;
  
  const rows = els.bakersTbody.querySelectorAll('tr');
  rows.forEach(row => {
    const isFlour = row.classList.contains('flour-row');
    if (isFlour) return;

    const percentSpan = row.querySelector('.percent-display');
    const percent = parseFloat(percentSpan.innerText) || 0;
    const weightInput = row.querySelector('.ing-weight');
    
    const newWeight = Math.round((percent / 100) * newFlourWeight * 10) / 10;
    weightInput.value = newWeight || '';
  });
}

function saveRecipe() {
  const name = els.inputRecipeName.value.trim();
  if (!name) {
    showToast('请输入配方名称 ✍️');
    return;
  }

  const id = els.inputRecipeId.value;
  const bulkTime = parseInt(els.inputTimeBulk.value) || 60;
  const proofTime = parseInt(els.inputTimeProof.value) || 45;

  const ingredients = [];
  const rows = els.bakersTbody.querySelectorAll('tr');
  
  rows.forEach(row => {
    const ingName = row.querySelector('.ing-name').value.trim();
    const ingWeight = parseFloat(row.querySelector('.ing-weight').value) || 0;
    const isFlour = row.classList.contains('flour-row');
    
    if (ingName && ingWeight > 0) {
      ingredients.push({
        name: ingName,
        weight: ingWeight,
        isFlour: isFlour
      });
    }
  });

  if (ingredients.length === 0) {
    showToast('请至少添加一种有效原料 🥐');
    return;
  }

  const recipe = {
    id: id || undefined,
    name,
    ingredients,
    bulkTime,
    proofTime
  };

  window.HandmadeDB.saveRecipe(recipe).then(() => {
    showToast('配方保存成功! ✨');
    closeRecipeSheet();
    loadRecipesAndDiary();
  });
}

// --- RECIPE DETAIL SHEET ACTIONS ---
function openRecipeDetailSheet(recipe) {
  els.detailRecipeName.innerText = recipe.name;
  els.btnRecipeDetailEdit.setAttribute('data-id', recipe.id);
  els.selectRecipeScale.value = "1";
  
  renderRecipeDetailTable(recipe, 1);
  els.sheetRecipeDetail.classList.add('active');
}

function renderRecipeDetailTable(recipe, scale = 1) {
  els.detailIngredientsTbody.innerHTML = '';
  const flourWeight = recipe.ingredients.find(item => item.isFlour)?.weight || 100;
  let totalCost = 0;

  recipe.ingredients.forEach(item => {
    const scaledWeight = Math.round(item.weight * scale * 10) / 10;
    const percentage = Math.round((item.weight / flourWeight) * 1000) / 10;
    
    // Cost calculation
    const pricePerKg = state.ingredientPrices[item.name] || 0;
    const cost = (scaledWeight / 1000) * pricePerKg;
    totalCost += cost;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:500;">${item.name}</td>
      <td style="text-align: right; font-variant-numeric: tabular-nums; font-weight:600;">${scaledWeight}g</td>
      <td style="text-align: right;">
        <span class="percentage-badge">${item.isFlour ? '100%' : percentage + '%'}</span>
      </td>
    `;
    els.detailIngredientsTbody.appendChild(tr);
  });

  els.detailRecipeCost.innerText = `¥${totalCost.toFixed(2)}`;
}

// --- FERMENTATION TIMELINE & TIMERS ---
function startBakingProcess(recipe, scale = 1) {
  // Construct baking timeline phases
  const steps = [
    { name: '水解 (Autolyse)', duration: 30, state: 'pending' },
    { name: '揉面 (Mixing & Kneading)', duration: 15, state: 'pending' },
    { name: '主发酵 (Bulk Ferment)', duration: recipe.bulkTime, state: 'pending' },
    { name: '折叠翻面 (Stretch & Fold)', duration: 20, state: 'pending' },
    { name: '松弛整形 (Shaping & Rest)', duration: 20, state: 'pending' },
    { name: '二次发酵 (Final Proof)', duration: recipe.proofTime, state: 'pending' },
    { name: '烘烤 (Baking)', duration: 35, state: 'pending' }
  ];

  // Calculate scaled cost
  let totalCost = 0;
  recipe.ingredients.forEach(item => {
    const scaledWeight = item.weight * scale;
    const pricePerKg = state.ingredientPrices[item.name] || 0;
    totalCost += (scaledWeight / 1000) * pricePerKg;
  });

  state.activeBake = {
    recipeId: recipe.id,
    recipeName: recipe.name,
    scale: scale,
    ingredientsSnapshot: recipe.ingredients.map(i => ({ ...i, weight: i.weight * scale })),
    steps: steps,
    currentStepIndex: 0,
    elapsedSeconds: 0,
    timerSecondsRemaining: steps[0].duration * 60,
    startTime: new Date().toISOString(),
    tempLogs: [],
    humidityLogs: [],
    cost: totalCost,
    totalMinutesPlanned: steps.reduce((sum, s) => sum + s.duration, 0)
  };

  state.activeBake.steps[0].state = 'active';
  
  saveActiveBakeState();
  
  els.sheetRecipeDetail.classList.remove('active');
  switchPanel('rhythm');
  
  // Clear any existing active interval
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.isTimerRunning = false;
  updateTimerButtonsUI();
  
  renderActiveBakeUI();
  
  showToast(`开始制作发酵: ${recipe.name} ⏱️`);
}

function saveActiveBakeState() {
  localStorage.setItem('activeBakeState', JSON.stringify(state.activeBake));
}

function restoreActiveBakeState() {
  const savedState = localStorage.getItem('activeBakeState');
  if (savedState) {
    try {
      state.activeBake = JSON.parse(savedState);
      // If it was running, we restore it, but pause it by default so it doesn't drift
      renderActiveBakeUI();
    } catch (e) {
      console.error('Failed to parse saved activeBakeState', e);
    }
  }
}

function renderActiveBakeUI() {
  if (!state.activeBake) {
    els.noActiveBake.style.display = 'block';
    els.activeBakeContainer.style.display = 'none';
    return;
  }

  els.noActiveBake.style.display = 'none';
  els.activeBakeContainer.style.display = 'block';

  els.activeBakeTitle.innerText = `制作中: ${state.activeBake.recipeName} (${state.activeBake.scale}x)`;
  
  const currentStep = state.activeBake.steps[state.activeBake.currentStepIndex];
  els.activeBakeStepNum.innerText = `步骤 ${state.activeBake.currentStepIndex + 1}/${state.activeBake.steps.length}`;
  els.timerStepName.innerText = currentStep.name;
  
  // Render timer count
  updateTimerDisplay(state.activeBake.timerSecondsRemaining);
  
  // Render Timeline steps
  els.activeTimeline.innerHTML = '';
  state.activeBake.steps.forEach((step, idx) => {
    const nodeClass = state.activeBake.currentStepIndex === idx ? 'active' : (idx < state.activeBake.currentStepIndex ? 'completed' : '');
    const stepEl = document.createElement('div');
    stepEl.className = `timeline-step ${nodeClass}`;
    
    // Status text
    let statusText = `${step.duration} 分钟`;
    if (idx < state.activeBake.currentStepIndex) {
      statusText = '已完成 ✓';
    } else if (idx === state.activeBake.currentStepIndex) {
      statusText = '进行中...';
    }

    stepEl.innerHTML = `
      <div class="timeline-node"></div>
      <div class="timeline-content">
        <div class="timeline-time">${statusText}</div>
        <div class="timeline-title">${step.name}</div>
      </div>
    `;
    els.activeTimeline.appendChild(stepEl);
  });

  updateTimerButtonsUI();
}

function updateTimerDisplay(totalSecs) {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  
  let timeStr = '';
  if (hrs > 0) {
    timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  els.timerTime.innerText = timeStr;
}

function updateTimerButtonsUI() {
  if (state.isTimerRunning) {
    els.iconPlay.style.display = 'none';
    els.iconPause.style.display = 'inline-block';
    els.textTimerToggle.innerText = '暂停';
  } else {
    els.iconPlay.style.display = 'inline-block';
    els.iconPause.style.display = 'none';
    els.textTimerToggle.innerText = '开始';
  }
}

function toggleTimer() {
  if (!state.activeBake) return;

  if (state.isTimerRunning) {
    // Pause
    clearInterval(state.timerInterval);
    state.isTimerRunning = false;
    updateTimerButtonsUI();
    saveActiveBakeState();
  } else {
    // Start
    state.isTimerRunning = true;
    updateTimerButtonsUI();
    
    // Unlock iOS Audio Context
    unlockAudioContext();
    
    state.timerInterval = setInterval(() => {
      if (state.activeBake.timerSecondsRemaining > 0) {
        state.activeBake.timerSecondsRemaining--;
        state.activeBake.elapsedSeconds++;
        updateTimerDisplay(state.activeBake.timerSecondsRemaining);
        
        // Save state every 5 seconds to reduce writes
        if (state.activeBake.timerSecondsRemaining % 5 === 0) {
          saveActiveBakeState();
        }
      } else {
        // Step timer finished!
        playAlarmSound();
        skipBakeStep();
      }
    }, 1000);
  }
}

function skipBakeStep() {
  if (!state.activeBake) return;

  // Complete current step
  state.activeBake.steps[state.activeBake.currentStepIndex].state = 'completed';
  
  if (state.activeBake.currentStepIndex < state.activeBake.steps.length - 1) {
    // Proceed to next step
    state.activeBake.currentStepIndex++;
    const nextStep = state.activeBake.steps[state.activeBake.currentStepIndex];
    state.activeBake.timerSecondsRemaining = nextStep.duration * 60;
    nextStep.state = 'active';
    
    saveActiveBakeState();
    renderActiveBakeUI();
    
    if (state.isTimerRunning) {
      showToast(`进入下一步: ${nextStep.name} ⏱️`);
    }
  } else {
    // Last step completed!
    clearInterval(state.timerInterval);
    state.isTimerRunning = false;
    showToast('所有发酵制作步骤已完成！🎉');
    openFinishBakeSheet();
  }
}

// --- SYNTHESIZED ALARM (Web Audio API) ---
let audioCtx = null;
function unlockAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playAlarmSound() {
  try {
    unlockAudioContext();
    
    // Create a sweet bird-like double beep (cozy for bakers)
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sine';
    
    // Soft volume curve
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    
    // Double pulse tone frequency
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.25); // D6 note
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.8);
    
    // Soft phone vibration if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (e) {
    console.warn('Web Audio alarm failed to play:', e);
  }
}

// --- FINISH BAKE / PHOTO CAPTURE SHEET ---
function openFinishBakeSheet() {
  if (!state.activeBake) return;
  
  // Fill details
  els.finishSummaryRecipe.innerText = state.activeBake.recipeName;
  els.finishSummaryCost.innerText = `¥${state.activeBake.cost.toFixed(2)}`;
  
  const elapsedMins = Math.round(state.activeBake.elapsedSeconds / 60) || state.activeBake.totalMinutesPlanned;
  els.finishSummaryDuration.innerText = `${elapsedMins} 分钟`;

  // Default ratings
  state.selectedStars = 5;
  updateStarsUI(5);
  
  // Clear file input & previews
  els.cameraFileInput.value = '';
  els.photoPreviewImg.src = '';
  els.photoPreviewImg.style.display = 'none';
  els.photoPreviewPlaceholder.style.display = 'flex';
  els.inputFinishNotes.value = '';

  els.sheetFinishBake.classList.add('active');
}

function handlePhotoCapture(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Render a spinner or preview instantly
  const reader = new FileReader();
  reader.onload = (e) => {
    // Show local preview immediately
    els.photoPreviewImg.src = e.target.result;
    els.photoPreviewImg.style.display = 'block';
    els.photoPreviewPlaceholder.style.display = 'none';
    
    // Compress image in background to keep IndexedDB light
    compressImage(e.target.result, 800, 0.75).then(compressedBase64 => {
      els.photoPreviewImg.src = compressedBase64;
    });
  };
  reader.readAsDataURL(file);
}

function compressImage(base64Str, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate aspect scaling
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
  });
}

function updateStarsUI(rating) {
  const starSpans = els.starsPickerContainer.querySelectorAll('span');
  starSpans.forEach(span => {
    const starVal = parseInt(span.getAttribute('data-star'));
    if (starVal <= rating) {
      span.classList.add('active');
    } else {
      span.classList.remove('active');
    }
  });
}

function saveBakeDiary() {
  if (!state.activeBake) return;

  // Add environment data logs if filled
  const temp = parseFloat(els.inputEnvTemp.value) || null;
  const humidity = parseFloat(els.inputEnvHumidity.value) || null;
  const envNotes = els.inputEnvNotes.value.trim();
  
  const notes = els.inputFinishNotes.value.trim() || '美味手作，打卡记录 🥐';
  const photo = els.photoPreviewImg.style.display === 'block' ? els.photoPreviewImg.src : null;
  
  const elapsedMins = Math.round(state.activeBake.elapsedSeconds / 60) || state.activeBake.totalMinutesPlanned;

  const bakeRecord = {
    recipeId: state.activeBake.recipeId,
    recipeName: state.activeBake.recipeName,
    scale: state.activeBake.scale,
    ingredientsSnapshot: state.activeBake.ingredientsSnapshot,
    date: new Date().toISOString(),
    temp: temp,
    humidity: humidity,
    notes: notes,
    envNotes: envNotes,
    rating: state.selectedStars,
    photo: photo, // Holds compressed base64 string
    cost: state.activeBake.cost,
    duration: elapsedMins
  };

  window.HandmadeDB.saveBake(bakeRecord).then(() => {
    showToast('日记已成功存档 🌸');
    
    // Clear active bake state
    state.activeBake = null;
    localStorage.removeItem('activeBakeState');
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.isTimerRunning = false;

    // Refresh data
    loadRecipesAndDiary();
    
    els.sheetFinishBake.classList.remove('active');
    switchPanel('gallery');
  });
}

// --- DIARY/GALLERY PANEL RENDERING ---
function renderDiaryUI() {
  els.diaryListContainer.innerHTML = '';

  if (state.bakes.length === 0) {
    els.diaryListContainer.innerHTML = `
      <div class="glass-card text-center" style="padding: 40px 20px;">
        <p style="color: var(--text-muted); margin-bottom: 12px;">还没有烘焙手作日记呢 🌱</p>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">开启你的第一次发酵流程，烤好后拍照打分吧！</p>
        <button class="btn btn-primary" id="btn-diary-goto-recipes">去查看配方</button>
      </div>
    `;
    document.getElementById('btn-diary-goto-recipes').addEventListener('click', () => switchPanel('recipes'));
    return;
  }

  state.bakes.forEach(bake => {
    const formattedDate = new Date(bake.date).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const card = document.createElement('div');
    card.className = 'glass-card diary-card';
    
    // Render stars string
    let starsHtml = '';
    for (let s = 1; s <= 5; s++) {
      starsHtml += s <= bake.rating ? '★' : '☆';
    }

    const hasPhoto = !!bake.photo;
    const photoHtml = hasPhoto 
      ? `<img class="diary-img" src="${bake.photo}" alt="${bake.recipeName}">`
      : `<div class="diary-placeholder-img"><span>🥐 还没有添加照片</span></div>`;

    card.innerHTML = `
      <div class="diary-img-container">
        ${photoHtml}
      </div>
      <div class="diary-body">
        <div class="diary-header">
          <div>
            <h3 class="diary-title">${bake.recipeName}</h3>
            <span class="diary-date">${formattedDate}</span>
          </div>
          <div style="text-align: right;">
            <div class="diary-stars">${starsHtml}</div>
            <span style="font-size: 11px; background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.5); padding: 2px 6px; border-radius: 6px; color: var(--text-muted);">
              ${bake.scale}x 倍率
            </span>
          </div>
        </div>
        <p class="diary-notes">${bake.notes}</p>
        
        <div style="display: flex; gap: 12px; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 10px; font-size: 11.5px; color: var(--text-muted);">
          <span>⏱️ 制作 ${bake.duration}分</span>
          <span>💰 成本 ¥${bake.cost.toFixed(2)}</span>
          ${bake.temp ? `<span>🌡️ ${bake.temp}°C</span>` : ''}
          ${bake.humidity ? `<span>💧 ${bake.humidity}%</span>` : ''}
        </div>
        
        <div style="text-align: right; margin-top: 12px;">
          <button class="btn btn-sm btn-delete-diary" data-id="${bake.id}" style="color: #d90429; padding: 4px 8px; border: 1px solid rgba(217,4,41,0.15); background: transparent;">删除记录</button>
        </div>
      </div>
    `;

    // Bind delete diary log button
    card.querySelector('.btn-delete-diary').addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.target.getAttribute('data-id');
      showConfirmModal('删除日记记录？', '确定要删除这条烘焙日记吗？对应的照片也会被彻底清除。')
        .then(confirm => {
          if (confirm) {
            window.HandmadeDB.deleteBake(id).then(() => {
              showToast('日记已被删除 🗑️');
              loadRecipesAndDiary();
            });
          }
        });
    });

    els.diaryListContainer.appendChild(card);
  });
}

// --- COST CALCULATOR PANEL ACTIONS ---
function renderCostSettings() {
  els.ingredientPricesContainer.innerHTML = '';
  
  // Collect all unique ingredients used in active recipes + default ones
  const ingredientNames = new Set(state.defaultIngredients.map(i => i.name));
  state.recipes.forEach(r => {
    r.ingredients.forEach(i => ingredientNames.add(i.name));
  });

  ingredientNames.forEach(name => {
    const price = state.ingredientPrices[name] !== undefined ? state.ingredientPrices[name] : (DEFAULT_PRICES[name] || 0);
    
    const div = document.createElement('div');
    div.className = 'cost-item';
    div.innerHTML = `
      <span class="cost-item-name">${name}</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <input type="number" step="0.01" class="glass-input ing-price-input" data-name="${name}" value="${price}" style="width: 100px; text-align: right; padding: 6px 10px;">
        <span style="font-size: 13px; color: var(--text-muted);">元 / kg</span>
      </div>
    `;
    els.ingredientPricesContainer.appendChild(div);
  });
}

function saveIngredientPrices() {
  const inputs = els.ingredientPricesContainer.querySelectorAll('.ing-price-input');
  const list = [];
  
  inputs.forEach(input => {
    const name = input.getAttribute('data-name');
    const price = parseFloat(input.value) || 0;
    
    list.push({ id: name, price: price });
    state.ingredientPrices[name] = price;
  });

  window.HandmadeDB.saveIngredientsBatch(list).then(() => {
    showToast('价格库更新成功！💰');
    loadRecipesAndDiary(); // Reload recipes detail cost if views are cached
  });
}
window.appState = state;
