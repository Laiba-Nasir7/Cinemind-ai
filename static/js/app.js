/**
 * CineMind AI 2.5 - Studio Application Controller
 * Handles Preset Loading, Theme Switching, SSE Streaming, Chart Rendering, and PDF/CSV Exports.
 */

let currentBibleData = null;
let budgetChartInstance = null;
let budgetBarChartInstance = null;
let dnaTensionChartInstance = null;

// Helper to resolve element with fallback alias ID
function getEl(primaryId, fallbackId) {
    return document.getElementById(primaryId) || (fallbackId ? document.getElementById(fallbackId) : null);
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initPresets();
    initFileUpload();
    initTextStats();
    initEventListeners();
});

/* ==========================================================================
   0. Theme Management (Dark / Light Mode)
   ========================================================================== */
function initTheme() {
    const savedTheme = localStorage.getItem('cinemind_theme') || 'dark';
    applyTheme(savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('cinemind_theme', theme);

    const icon = document.getElementById('themeIcon') || document.getElementById('themeToggleIcon');
    const label = document.getElementById('themeLabel');
    if (icon) {
        icon.innerText = theme === 'light' ? '☀️' : '🌙';
    }
    if (label) {
        label.innerText = theme === 'light' ? 'LIGHT' : 'DARK';
    }

    updateChartThemes();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
}

function getChartThemeColors() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (theme === 'light') {
        return {
            text: '#59636E',
            grid: 'rgba(31, 35, 40, 0.08)',
            border: '#FFFFFF',
            tooltipBg: '#FFFFFF',
            tooltipText: '#1F2328',
            tooltipBorder: '#0284C7'
        };
    }
    return {
        text: '#8B949E',
        grid: 'rgba(240, 246, 252, 0.07)',
        border: '#161B22',
        tooltipBg: '#07090D',
        tooltipText: '#F0F6FC',
        tooltipBorder: '#0EA5E9'
    };
}

function updateChartThemes() {
    const colors = getChartThemeColors();

    if (budgetChartInstance) {
        if (budgetChartInstance.options.plugins?.legend?.labels) {
            budgetChartInstance.options.plugins.legend.labels.color = colors.text;
        }
        if (budgetChartInstance.data.datasets[0]) {
            budgetChartInstance.data.datasets[0].borderColor = colors.border;
        }
        budgetChartInstance.update();
    }

    if (budgetBarChartInstance) {
        if (budgetBarChartInstance.options.scales?.x?.ticks) {
            budgetBarChartInstance.options.scales.x.ticks.color = colors.text;
        }
        if (budgetBarChartInstance.options.scales?.y?.ticks) {
            budgetBarChartInstance.options.scales.y.ticks.color = colors.text;
        }
        if (budgetBarChartInstance.options.scales?.x?.grid) {
            budgetBarChartInstance.options.scales.x.grid.color = colors.grid;
        }
        if (budgetBarChartInstance.options.scales?.y?.grid) {
            budgetBarChartInstance.options.scales.y.grid.color = colors.grid;
        }
        budgetBarChartInstance.update();
    }

    if (dnaTensionChartInstance) {
        if (dnaTensionChartInstance.options.scales?.x) {
            dnaTensionChartInstance.options.scales.x.ticks.color = colors.text;
            dnaTensionChartInstance.options.scales.x.grid.color = colors.grid;
        }
        if (dnaTensionChartInstance.options.plugins?.tooltip) {
            dnaTensionChartInstance.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
            dnaTensionChartInstance.options.plugins.tooltip.borderColor = colors.tooltipBorder;
            if (dnaTensionChartInstance.options.plugins.tooltip.titleColor) {
                dnaTensionChartInstance.options.plugins.tooltip.titleColor = colors.tooltipText;
                dnaTensionChartInstance.options.plugins.tooltip.bodyColor = colors.tooltipText;
            }
        }
        dnaTensionChartInstance.update();
    }
}

/* ==========================================================================
   1. Preset Screenplay Management
   ========================================================================== */
function initPresets() {
    fetch('/api/presets')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                const listEl = document.getElementById('presetMenuList');
                if (!listEl) return;
                listEl.innerHTML = '<li><h6 class="dropdown-header">1-Click Hackathon Presets</h6></li>';

                data.presets.forEach(p => {
                    const item = document.createElement('li');
                    item.innerHTML = `
                        <a class="dropdown-item py-2" href="#" onclick="loadPreset('${p.id}')">
                            <div class="fw-bold text-cyan">${p.title}</div>
                            <div class="text-xxs text-muted">${p.genre} • Est. ${p.estimated_budget}</div>
                        </a>
                    `;
                    listEl.appendChild(item);
                });

                // Auto-load first preset by default for instant hackathon showcase
                loadPreset('neon_horizon');
            }
        })
        .catch(err => console.error('Error fetching presets:', err));
}

function loadPreset(presetId) {
    fetch(`/api/preset/${presetId}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                const p = data.preset;
                const titleInput = getEl('scriptTitleInput', 'projectTitle');
                const textarea = getEl('scriptTextarea', 'screenplayText');
                if (titleInput) titleInput.value = p.title;
                if (textarea) textarea.value = p.content;
                updateStatsBadge(data.stats);
                logToTerminal(`Loaded Preset Screenplay: '${p.title}' (${p.genre})`, 'init');
            }
        })
        .catch(err => console.error('Error loading preset content:', err));
}

/* ==========================================================================
   2. File Upload & Text Parser
   ========================================================================== */
function initFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    if (!dropZone || !fileInput) return;

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-cyan');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-cyan');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-cyan');
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
}

function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);

    logToTerminal(`Uploading & Parsing file: ${file.name}...`, 'init');

    fetch('/api/parse-file', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            const textarea = getEl('scriptTextarea', 'screenplayText');
            const titleInput = getEl('scriptTitleInput', 'projectTitle');
            if (textarea) textarea.value = data.text;
            const cleanedTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            if (titleInput) titleInput.value = cleanedTitle;
            updateStatsBadge(data.stats);
            logToTerminal(`Successfully parsed '${file.name}'. Found ${data.stats.estimated_scenes} estimated scenes.`, 'agent_complete');
        } else {
            alert('File Upload Error: ' + data.message);
        }
    })
    .catch(err => {
        console.error('File parse error:', err);
        alert('Failed to parse uploaded file.');
    });
}

function initTextStats() {
    const textarea = getEl('scriptTextarea', 'screenplayText');
    if (!textarea) return;
    textarea.addEventListener('input', () => {
        const text = textarea.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const sluglines = (text.match(/(?:INT\.|EXT\.|INT\/EXT\.)/gi) || []).length;
        updateStatsBadge({
            estimated_scenes: Math.max(sluglines, text ? 1 : 0),
            word_count: words
        });
    });
}

function updateStatsBadge(stats) {
    const badge = document.getElementById('scriptStatsBadge');
    if (badge) {
        badge.innerText = `${stats.estimated_scenes || 1} Scenes • ${stats.word_count || 0} Words`;
    }
}

function initEventListeners() {
    const runBtn = getEl('runPipelineBtn', 'runBtn');
    if (runBtn) {
        runBtn.addEventListener('click', runAutonomousPipeline);
    }

    const clearBtn = document.getElementById('clearTextBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const textarea = getEl('scriptTextarea', 'screenplayText');
            const titleInput = getEl('scriptTitleInput', 'projectTitle');
            if (textarea) textarea.value = '';
            if (titleInput) titleInput.value = '';
            updateStatsBadge({ estimated_scenes: 0, word_count: 0 });
        });
    }

    const exportPdf = document.getElementById('exportPdfBtn');
    if (exportPdf) exportPdf.addEventListener('click', exportStudioBiblePDF);

    const exportJson = document.getElementById('exportJsonBtn');
    if (exportJson) exportJson.addEventListener('click', exportJSON);

    // Scene search filter
    const sceneSearch = document.getElementById('sceneSearchInput');
    if (sceneSearch) {
        sceneSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.scene-card-item');
            cards.forEach(card => {
                const text = card.innerText.toLowerCase();
                card.style.display = text.includes(query) ? 'block' : 'none';
            });
        });
    }
}

function applyDoctorPreset(promptText) {
    const input = document.getElementById('scriptDoctorInput');
    if (input) {
        input.value = promptText;
        input.classList.add('border-cyan');
        setTimeout(() => input.classList.remove('border-cyan'), 1000);
    }
}

/* ==========================================================================
   3. Real-Time Multi-Agent SSE Streaming Execution
   ========================================================================== */
function runAutonomousPipeline() {
    const textarea = getEl('scriptTextarea', 'screenplayText');
    const titleInput = getEl('scriptTitleInput', 'projectTitle');
    const visualSelector = getEl('visualStyleSelector', 'visualStyle');
    const doctorInput = document.getElementById('scriptDoctorInput');
    const modelSelector = document.getElementById('modelSelector');

    const text = textarea ? textarea.value.trim() : '';
    const title = (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : 'Untitled Project';
    const model = modelSelector ? modelSelector.value : 'gemini-2.5-flash';
    const visualStyle = visualSelector ? visualSelector.value : 'Cyberpunk Neo-Noir';
    const doctorPrompt = doctorInput ? doctorInput.value.trim() : '';

    if (!text) {
        alert('Please paste screenplay text or load a preset screenplay first.');
        return;
    }

    // Reset UI state
    resetStepperUI();
    const logsEl = getEl('terminalLogs', 'liveConsole');
    if (logsEl) {
        if (logsEl.id === 'terminalLogs') logsEl.innerHTML = '';
        else {
            const inner = logsEl.querySelector('.terminal-logs') || logsEl;
            inner.innerHTML = '';
        }
    }
    const resultsSec = document.getElementById('resultsSection');
    if (resultsSec) resultsSec.classList.add('d-none');

    const statusPill = document.getElementById('pipelineStatusPill');
    if (statusPill) {
        statusPill.innerText = 'Running Pipeline...';
        statusPill.className = 'badge bg-cyan text-white font-mono';
    }

    logToTerminal(`Initializing CineMind AI Pipeline (Style: '${visualStyle}')...`, 'init');
    if (doctorPrompt) {
        logToTerminal(`Script Doctor Prompt Applied: "${doctorPrompt}"`, 'init');
    }

    // Store temp text for SSE streaming
    fetch('/api/store-temp-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: text,
            title: title,
            model: model,
            visual_style: visualStyle,
            script_doctor_prompt: doctorPrompt
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            const queryParams = new URLSearchParams({
                token: data.token,
                model: model,
                visual_style: visualStyle,
                script_doctor_prompt: doctorPrompt
            });
            const eventSource = new EventSource(`/api/stream?${queryParams.toString()}`);

            eventSource.onmessage = (event) => {
                const evt = JSON.parse(event.data);
                handleSSEEvent(evt, eventSource);
            };

            eventSource.onerror = (err) => {
                console.error('SSE Stream Error:', err);
                eventSource.close();
                logToTerminal('Stream connection closed. Finalizing response...', 'agent_complete');
            };
        } else {
            alert('Error initializing pipeline: ' + data.message);
        }
    })
    .catch(err => {
        console.error('API Error:', err);
        alert('Failed to launch pipeline.');
    });
}

function handleSSEEvent(evt, eventSource) {
    // Update progress bar
    const pBar = document.getElementById('mainProgressBar');
    if (pBar) pBar.style.width = `${evt.progress}%`;

    // Log message to terminal
    logToTerminal(`[${evt.agent}] ${evt.log}`, evt.event);

    // Update Stepper steps (7-Agent Swarm)
    if (evt.progress >= 10) setStepActive(1);
    if (evt.progress >= 26) setStepActive(2);
    if (evt.progress >= 44) setStepActive(3);
    if (evt.progress >= 62) setStepActive(4);
    if (evt.progress >= 74) setStepActive(5);
    if (evt.progress >= 86) setStepActive(6);
    if (evt.progress >= 95) setStepActive(7);

    // Completion check
    if (evt.event === 'pipeline_complete' && evt.data) {
        eventSource.close();
        currentBibleData = evt.data;
        
        for (let i = 1; i <= 7; i++) {
            const el = document.getElementById(`step-${i}`);
            if (el) {
                el.className = 'col step-item completed';
                const statusEl = el.querySelector('.step-status');
                if (statusEl) statusEl.innerText = 'Completed';
            }
        }

        const statusPill = document.getElementById('pipelineStatusPill');
        if (statusPill) {
            statusPill.innerText = 'Completed';
            statusPill.className = 'badge bg-success text-white font-mono';
        }

        renderStudioBible(evt.data);
        const resultsSec = document.getElementById('resultsSection');
        if (resultsSec) {
            resultsSec.classList.remove('d-none');
            resultsSec.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function setStepActive(stepNum) {
    for (let i = 1; i <= 7; i++) {
        const el = document.getElementById(`step-${i}`);
        if (!el) continue;
        const statusEl = el.querySelector('.step-status');
        if (i < stepNum) {
            el.className = 'col step-item completed';
            if (statusEl) statusEl.innerText = 'Completed';
        } else if (i === stepNum) {
            el.className = 'col step-item active';
            if (statusEl) statusEl.innerText = 'Running';
        } else {
            el.className = 'col step-item';
            if (statusEl) statusEl.innerText = 'Queued';
        }
    }
}

function resetStepperUI() {
    const pBar = document.getElementById('mainProgressBar');
    if (pBar) pBar.style.width = '0%';
    for (let i = 1; i <= 7; i++) {
        const el = document.getElementById(`step-${i}`);
        if (el) {
            const statusEl = el.querySelector('.step-status');
            if (i === 1) {
                el.className = 'col step-item active';
                if (statusEl) statusEl.innerText = 'Running';
            } else {
                el.className = 'col step-item';
                if (statusEl) statusEl.innerText = 'Queued';
            }
        }
    }
}

function logToTerminal(msg, type = 'init') {
    const logsContainer = document.getElementById('terminalLogs') || (document.getElementById('liveConsole') ? document.getElementById('liveConsole').querySelector('.terminal-logs') : null);
    if (!logsContainer) return;
    const line = document.createElement('div');
    line.className = `log-line ${type}`;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const timeEl = document.getElementById('terminalTime');
    if (timeEl) timeEl.innerText = timeStr;

    line.innerHTML = `<span class="text-muted">[${timeStr}]</span> ${msg}`;
    logsContainer.appendChild(line);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

/* ==========================================================================
   4. Render Studio Bible Results Dashboard
   ========================================================================== */
function renderStudioBible(bible) {
    const breakdown = bible.script_breakdown || {};
    const forecast = bible.resource_forecast || {};
    const storyboard = bible.visual_storyboard || {};
    const pitch = bible.executive_pitch || {};
    const casting = bible.casting_analysis || {};
    const dna = bible.script_dna || {};
    const debate = bible.studio_debate || {};
    const telemetry = bible.telemetry || {};

    // Header info
    const titleEl = document.getElementById('resScriptTitle');
    if (titleEl) titleEl.innerText = breakdown.script_title || 'Film Project';
    const tsEl = document.getElementById('analysisTimestamp');
    if (tsEl) tsEl.innerText = `Generated: ${bible.analysis_timestamp || 'just now'} (${bible.execution_time_seconds || 0}s execution)`;

    // Tab 1: Executive Overview Metrics
    const mScenes = document.getElementById('metricScenes');
    if (mScenes) mScenes.innerText = breakdown.total_scenes || 0;
    const mPages = document.getElementById('metricPages');
    if (mPages) mPages.innerText = `Est. ${breakdown.estimated_pages || 1} script pages`;
    
    const mBudget = document.getElementById('metricBudget');
    if (mBudget) mBudget.innerText = `$${(forecast.total_budget_usd || 0).toLocaleString('en-US')}`;
    const mTier = document.getElementById('metricTier');
    if (mTier) mTier.innerText = forecast.budget_tier || 'Mid-Budget';

    const mCrew = document.getElementById('metricCrew');
    if (mCrew) mCrew.innerText = `${forecast.recommended_crew_size || 45} pax`;
    
    const riskCount = (forecast.risk_matrix || []).length;
    const mRisk = document.getElementById('metricRisk');
    if (mRisk) mRisk.innerText = riskCount > 2 ? 'HIGH RISK' : 'STABLE';
    const mRiskCount = document.getElementById('metricRiskCount');
    if (mRiskCount) mRiskCount.innerText = `${riskCount} risk mitigation flags`;

    const oLogline = document.getElementById('overviewLogline');
    if (oLogline) oLogline.innerText = pitch.logline || 'Logline pending...';
    const oSyn = document.getElementById('overviewSynopsis');
    if (oSyn) oSyn.innerText = pitch.synopsis || 'Synopsis pending...';
    const oExec = document.getElementById('overviewExecutiveSummary');
    if (oExec) oExec.innerText = pitch.executive_summary || 'Summary pending...';

    // Comps badges
    const compsContainer = document.getElementById('overviewCompsBadges');
    if (compsContainer) {
        compsContainer.innerHTML = (pitch.comparable_films || []).map(c => 
            `<span class="badge bg-secondary-subtle text-cyan border border-cyan border-opacity-25 font-mono px-2 py-1">${c}</span>`
        ).join('');
    }

    const oDemo = document.getElementById('overviewDemographic');
    if (oDemo) oDemo.innerText = pitch.target_demographic || 'Global Audience';
    const oPos = document.getElementById('overviewPositioning');
    if (oPos) oPos.innerText = pitch.market_positioning || 'Theatrical / Streaming';

    // Tab 2: Scene Breakdown Cards
    renderSceneBreakdown(breakdown.scenes || []);

    // Tab 3: Budget Chart & Table & Progress Meters
    renderBudgetSection(forecast);

    // Tab 4: Visual Storyboards & Lens
    renderVisualStoryboards(storyboard);

    // Tab 5: AI Casting Director & Star Attachments
    renderCastingDirector(casting);

    // Tab 6: Script DNA & Narrative Arc Architecture
    renderScriptDNA(dna);

    // Tab 7: Studio Greenlight War Room Debate
    renderStudioDebate(debate);

    // Tab 8: Risk Matrix
    renderRiskMatrix(forecast.risk_matrix || []);

    // Tab 9: Grafana Observability Studio
    renderGrafanaTelemetry(telemetry);
}

function renderSceneBreakdown(scenes) {
    const container = document.getElementById('scenesContainer');
    if (!container) return;
    container.innerHTML = scenes.map(s => `
        <div class="col-md-6 scene-card-item">
            <div class="card bg-surface-elevated border rounded-3 p-3 h-100 position-relative overflow-hidden">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="badge bg-cyan text-white font-mono fw-bold">SCENE ${s.scene_number}</span>
                    <span class="badge bg-secondary-subtle text-primary-themed border font-mono">${s.setting} • ${s.time_of_day}</span>
                </div>
                <h6 class="fw-bold text-primary-themed font-mono mb-2">${s.slugline}</h6>
                <p class="text-secondary-themed text-xs mb-3">${s.summary}</p>
                
                <div class="d-flex flex-wrap gap-2 text-xxs mb-2">
                    <span class="text-cyan font-mono"><i class="fa-solid fa-users me-1"></i> Cast:</span>
                    ${(s.characters_present || []).map(c => `<span class="badge bg-secondary-subtle text-primary-themed border">${c}</span>`).join(' ')}
                </div>
                
                <div class="d-flex flex-wrap gap-2 text-xxs">
                    <span class="text-warning font-mono"><i class="fa-solid fa-box me-1"></i> Props:</span>
                    ${(s.props_required || []).map(p => `<span class="badge bg-warning-subtle text-warning border border-warning border-opacity-25">${p}</span>`).join(' ')}
                </div>
                
                <div class="mt-3 pt-2 border-top d-flex justify-content-between text-xxs text-muted font-mono">
                    <span>Tone: ${s.emotional_tone}</span>
                    <span>Est. Shoot: ${s.estimated_shoot_hours} hrs</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderBudgetSection(forecast) {
    const items = forecast.budget_breakdown || [];
    const totalBudget = forecast.total_budget_usd || 1;
    const chartTheme = getChartThemeColors();
    
    // 1. Render Chart.js Doughnut (Allocation Share)
    const ctxDoughnutEl = document.getElementById('budgetChart');
    if (ctxDoughnutEl) {
        const ctxDoughnut = ctxDoughnutEl.getContext('2d');
        if (budgetChartInstance) {
            budgetChartInstance.destroy();
        }

        const labels = items.map(i => i.category);
        const dataValues = items.map(i => i.cost_usd);
        const chartColors = ['#0EA5E9', '#D29922', '#F85149', '#58A6FF', '#3FB950', '#A371F7'];

        budgetChartInstance = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: chartColors,
                    borderWidth: 2,
                    borderColor: chartTheme.border
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: chartTheme.text, font: { family: 'JetBrains Mono', size: 10 } }
                    }
                }
            }
        });
    }

    // 2. Render Chart.js Category Bar Chart
    const ctxBarEl = document.getElementById('budgetCategoryBarChart');
    if (ctxBarEl) {
        const ctxBar = ctxBarEl.getContext('2d');
        if (budgetBarChartInstance) {
            budgetBarChartInstance.destroy();
        }

        const labels = items.map(i => i.category);
        const dataValues = items.map(i => i.cost_usd);
        const chartColors = ['#0EA5E9', '#D29922', '#F85149', '#58A6FF', '#3FB950', '#A371F7'];

        budgetBarChartInstance = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labels.map(l => l.length > 15 ? l.substring(0, 15) + '...' : l),
                datasets: [{
                    label: 'Budget (USD)',
                    data: dataValues,
                    backgroundColor: chartColors,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: chartTheme.grid },
                        ticks: { color: chartTheme.text, font: { family: 'JetBrains Mono', size: 9 } }
                    },
                    y: {
                        grid: { color: chartTheme.grid },
                        ticks: { color: chartTheme.text, font: { family: 'JetBrains Mono', size: 9 } }
                    }
                }
            }
        });
    }

    // 3. Render Cost Allocation Progress Meters
    const progressContainer = document.getElementById('budgetProgressBarsContainer');
    if (progressContainer) {
        const chartColors = ['#0EA5E9', '#D29922', '#F85149', '#58A6FF', '#3FB950', '#A371F7'];
        progressContainer.innerHTML = items.map((item, idx) => {
            const pct = Math.round((item.cost_usd / totalBudget) * 100);
            const color = chartColors[idx % chartColors.length];
            return `
                <div class="col-md-6">
                    <div class="p-3 bg-surface-elevated rounded-3 border">
                        <div class="d-flex justify-content-between align-items-center mb-1 font-mono text-xxs">
                            <span class="text-primary-themed fw-bold">${item.category}</span>
                            <span class="text-cyan">${pct}% ($${item.cost_usd.toLocaleString('en-US')})</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar" role="progressbar" style="width: ${pct}%; background-color: ${color};"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. Render Table
    const tbody = document.getElementById('budgetTableBody');
    if (tbody) {
        tbody.innerHTML = items.map(i => `
            <tr>
                <td class="font-mono text-cyan fw-bold text-xs">${i.category}</td>
                <td class="text-primary-themed text-xs">${i.description}</td>
                <td class="font-mono text-warning fw-bold text-xs">$${i.cost_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="text-secondary-themed text-xxs">${i.rationale}</td>
            </tr>
        `).join('');
    }

    // 5. Render Logistics Summary List
    const logisticsList = document.getElementById('logisticsSummaryList');
    if (logisticsList) {
        logisticsList.innerHTML = `
            <div class="p-3 bg-surface-elevated rounded-3 border">
                <div class="text-xxs text-muted font-mono">TOTAL ESTIMATED BUDGET</div>
                <div class="fs-4 fw-bold text-warning font-mono">$${(forecast.total_budget_usd || 0).toLocaleString('en-US')}</div>
                <div class="text-xxs text-cyan mt-1">${forecast.budget_tier || 'Mid-Budget'}</div>
            </div>
            <div class="p-3 bg-surface-elevated rounded-3 border">
                <div class="text-xxs text-muted font-mono">RECOMMENDED CREW ALLOCATION</div>
                <div class="fs-4 fw-bold text-info font-mono">${forecast.recommended_crew_size || 45} On-Set Crew Members</div>
                <div class="text-xxs text-muted mt-1">Includes Camera Operator, Gaffer, Wire Rigger, VFX Tracker, Sound Mixer</div>
            </div>
        `;
    }
}

function renderVisualStoryboards(storyboard) {
    const styleDesc = document.getElementById('storyboardStyleDesc');
    if (styleDesc) styleDesc.innerText = storyboard.cinematic_style || 'Anamorphic 35mm visual direction';

    // Color Swatches
    const swatchesContainer = document.getElementById('storyboardColorPalette');
    if (swatchesContainer) {
        swatchesContainer.innerHTML = (storyboard.color_palette_hex || ['#0EA5E9', '#D29922', '#0D1117']).map(hex => `
            <div class="color-swatch rounded-circle" style="width: 20px; height: 20px; background-color: ${hex}; border: 1px solid rgba(255,255,255,0.3);" title="${hex}"></div>
        `).join('');
    }

    // Storyboard Cards Grid
    const grid = document.getElementById('storyboardGrid');
    if (!grid) return;
    grid.innerHTML = (storyboard.shots || []).map(shot => `
        <div class="col-md-6 col-lg-4">
            <div class="card bg-surface-elevated border rounded-3 p-3 h-100 d-flex flex-column gap-2">
                <!-- Visual SVG Camera Framing Preview Canvas -->
                <div class="storyboard-preview-canvas ratio-scope rounded-3 border p-2 text-center position-relative overflow-hidden">
                    <svg width="100%" height="100%" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" class="rounded">
                        <rect width="320" height="180" fill="#090D16"/>
                        <!-- Grid lines (Rule of Thirds) -->
                        <line x1="106" y1="0" x2="106" y2="180" stroke="rgba(14, 165, 233, 0.2)" stroke-dasharray="4"/>
                        <line x1="213" y1="0" x2="213" y2="180" stroke="rgba(14, 165, 233, 0.2)" stroke-dasharray="4"/>
                        <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(14, 165, 233, 0.2)" stroke-dasharray="4"/>
                        <line x1="0" y1="120" x2="320" y2="120" stroke="rgba(14, 165, 233, 0.2)" stroke-dasharray="4"/>
                        <!-- Stylized Camera Reticle -->
                        <circle cx="160" cy="90" r="35" stroke="#0EA5E9" stroke-width="1.5" fill="none" opacity="0.8"/>
                        <circle cx="160" cy="90" r="4" fill="#D29922"/>
                        <text x="12" y="24" fill="#0EA5E9" font-family="monospace" font-size="10">SHOT ${shot.shot_number} | SCENE ${shot.scene_number}</text>
                        <text x="12" y="165" fill="#8B949E" font-family="monospace" font-size="9">${shot.shot_type.toUpperCase()}</text>
                    </svg>
                </div>

                <div class="d-flex align-items-center justify-content-between">
                    <span class="badge bg-cyan text-white font-mono text-xxs">SHOT #${shot.shot_number}</span>
                    <span class="badge bg-secondary-subtle border text-muted font-mono text-xxs">${shot.shot_type}</span>
                </div>

                <div class="d-flex align-items-center justify-content-between text-xxs font-mono">
                    <span class="text-primary-themed fw-bold">${shot.camera_movement}</span>
                    <span class="text-muted"><i class="fa-solid fa-sun me-1 text-warning"></i> ${shot.lighting_palette}</span>
                </div>
                <p class="text-secondary-themed text-xs mb-2">${shot.description}</p>

                <div class="p-2 bg-surface-subtle rounded border font-mono text-xxs position-relative mt-auto">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                        <span><i class="fa-solid fa-wand-magic-sparkles me-1 text-warning"></i> GenAI Prompt:</span>
                        <button class="btn btn-xs btn-outline-cyan py-0 px-2 font-mono text-xxs" onclick="copyPrompt(\`${shot.genai_image_prompt.replace(/`/g, '\\`')}\`, this)">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                    </div>
                    <div class="text-muted text-xxs user-select-all">${shot.genai_image_prompt}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCastingDirector(casting) {
    if (!casting) return;

    const starPowerEl = document.getElementById('castingStarPowerBadge');
    if (starPowerEl) starPowerEl.innerText = casting.projected_star_power_tier || 'A-List Marquee';

    const budgetEl = document.getElementById('castingBudgetBadge');
    if (budgetEl) budgetEl.innerText = `Est. Cast Budget: $${(casting.estimated_total_cast_budget_usd || 0).toLocaleString('en-US')}`;

    const overviewEl = document.getElementById('castingEnsembleOverview');
    if (overviewEl) overviewEl.innerText = casting.ensemble_overview || 'Ensemble formulated.';

    const container = document.getElementById('castingCardsContainer');
    if (!container) return;

    const characters = casting.characters || [];
    container.innerHTML = characters.map(char => {
        const primary = char.primary_pick || {};
        const alt = char.alternative_indie_pick || {};
        const score = primary.match_score_pct || 92;
        const scoreColor = score >= 95 ? 'text-success' : (score >= 90 ? 'text-cyan' : 'text-warning');

        return `
            <div class="col-md-6 col-lg-4">
                <div class="card bg-surface-elevated border rounded-3 p-3 h-100 d-flex flex-column justify-content-between position-relative overflow-hidden">
                    <div>
                        <!-- Character Header -->
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="badge bg-secondary-subtle border text-primary-themed font-mono text-xxs">${char.character_archetype}</span>
                            <span class="badge bg-cyan-subtle ${scoreColor} font-mono fw-bold text-xxs">${score}% MATCH</span>
                        </div>
                        <h6 class="fw-bold text-primary-themed font-mono mb-3">${char.character_name}</h6>

                        <!-- Primary A-List Star Attachment -->
                        <div class="p-3 bg-surface-subtle rounded-3 border mb-3">
                            <div class="d-flex align-items-center justify-content-between mb-1">
                                <span class="text-xxs text-muted font-mono"><i class="fa-solid fa-star text-warning me-1"></i> TOP ATTACHMENT</span>
                                <span class="badge bg-secondary-subtle border text-warning font-mono text-xxs">$${(primary.estimated_talent_fee_usd || 0).toLocaleString('en-US')}</span>
                            </div>
                            <h6 class="text-cyan fw-bold font-mono mb-1">${primary.actor_name}</h6>
                            <div class="text-xxs text-muted font-mono mb-2">${primary.bankability_tier}</div>
                            
                            <p class="text-secondary-themed text-xs mb-2">${primary.casting_rationale}</p>
                            
                            <div class="d-flex flex-wrap gap-1 mt-2">
                                <span class="text-xxs text-muted font-mono me-1">COMPS:</span>
                                ${(primary.reference_performances || []).map(ref => `
                                    <span class="badge bg-secondary-subtle text-muted border text-xxs font-mono">${ref}</span>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Alternative Indie / Prestige Pick -->
                        <div class="p-2 bg-surface-subtle rounded border">
                            <div class="d-flex align-items-center justify-content-between text-xs font-mono">
                                <span class="text-muted"><i class="fa-solid fa-masks-theater text-cyan me-1"></i> Value Option:</span>
                                <span class="text-primary-themed fw-bold">${alt.actor_name}</span>
                            </div>
                            <div class="d-flex justify-content-between text-xxs text-muted font-mono mt-1">
                                <span>${alt.bankability_tier}</span>
                                <span class="text-info">$${(alt.estimated_talent_fee_usd || 0).toLocaleString('en-US')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderScriptDNA(dna) {
    if (!dna) return;

    const arcBadge = document.getElementById('dnaArcBadge');
    if (arcBadge) arcBadge.innerText = dna.overall_arc_shape || 'Rising Crescendo';

    const pacingBadge = document.getElementById('dnaPacingBadge');
    if (pacingBadge) pacingBadge.innerText = dna.pacing_verdict || 'Propulsive Pacing';

    const quoteEl = document.getElementById('dnaFingerprintQuote');
    if (quoteEl) quoteEl.innerText = `"${dna.emotional_fingerprint || 'A cinematic narrative journey.'}"`;

    const avgTensionEl = document.getElementById('dnaAvgTension');
    if (avgTensionEl) avgTensionEl.innerText = `${(dna.average_tension || 6.5).toFixed(1)} / 10`;

    const peakSceneEl = document.getElementById('dnaPeakScene');
    if (peakSceneEl) peakSceneEl.innerText = `Scene #${dna.peak_tension_scene || 1}`;

    const dialogueRatioEl = document.getElementById('dnaDialogueRatio');
    if (dialogueRatioEl) {
        const ratio = dna.dialogue_to_action_ratio || 0.45;
        const dialoguePct = Math.round(ratio * 100);
        const actionPct = 100 - dialoguePct;
        dialogueRatioEl.innerText = `${dialoguePct}% Dialogue / ${actionPct}% Action`;
    }

    const scenePoints = dna.scene_dna || [];
    const maxBpm = scenePoints.length ? Math.max(...scenePoints.map(p => p.pacing_bpm || 80)) : 120;
    const bpmApexEl = document.getElementById('dnaBpmApex');
    if (bpmApexEl) bpmApexEl.innerText = `${maxBpm} BPM Apex`;

    const actNotesEl = document.getElementById('dnaActStructureNotes');
    if (actNotesEl) actNotesEl.innerText = dna.act_structure_notes || 'Three-act structure dynamic analysis formulated.';

    // 1. Render Dual-Axis Chart.js Arc (Tension & BPM)
    const chartCanvas = document.getElementById('dnaTensionChart');
    if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        if (dnaTensionChartInstance) {
            dnaTensionChartInstance.destroy();
        }

        const labels = scenePoints.map(p => `Scene ${p.scene_number}`);
        const tensionData = scenePoints.map(p => p.tension_score);
        const bpmData = scenePoints.map(p => p.pacing_bpm);
        const pointBgColors = scenePoints.map(p => p.color_hex || '#0EA5E9');
        const chartTheme = getChartThemeColors();

        const gradientTension = ctx.createLinearGradient(0, 0, 0, 260);
        gradientTension.addColorStop(0, 'rgba(14, 165, 233, 0.35)');
        gradientTension.addColorStop(1, 'rgba(14, 165, 233, 0.02)');

        dnaTensionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Dramatic Tension (0-10)',
                        data: tensionData,
                        borderColor: '#0EA5E9',
                        backgroundColor: gradientTension,
                        pointBackgroundColor: pointBgColors,
                        pointBorderColor: '#FFFFFF',
                        pointHoverRadius: 7,
                        pointRadius: 5,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Narrative Pacing (BPM)',
                        data: bpmData,
                        borderColor: '#D29922',
                        borderDash: [5, 5],
                        pointBackgroundColor: '#D29922',
                        pointRadius: 3.5,
                        borderWidth: 2,
                        fill: false,
                        tension: 0.25,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: chartTheme.tooltipBg,
                        titleColor: chartTheme.tooltipText,
                        bodyColor: chartTheme.tooltipText,
                        titleFont: { family: 'JetBrains Mono', size: 11 },
                        bodyFont: { family: 'Outfit', size: 11 },
                        borderColor: chartTheme.tooltipBorder,
                        borderWidth: 1,
                        callbacks: {
                            afterBody: function(context) {
                                const index = context[0].dataIndex;
                                const pt = scenePoints[index];
                                if (pt) {
                                    return `Emotion: ${pt.emotion_label} | Dialogue: ${Math.round(pt.dialogue_density * 100)}%`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: chartTheme.grid },
                        ticks: { color: chartTheme.text, font: { family: 'JetBrains Mono', size: 9 } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: 10,
                        grid: { color: chartTheme.grid },
                        ticks: {
                            color: '#0EA5E9',
                            font: { family: 'JetBrains Mono', size: 9 },
                            stepSize: 2
                        },
                        title: {
                            display: true,
                            text: 'Tension (0-10)',
                            color: '#0EA5E9',
                            font: { family: 'JetBrains Mono', size: 9 }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 30,
                        max: 150,
                        grid: { drawOnChartArea: false },
                        ticks: {
                            color: '#D29922',
                            font: { family: 'JetBrains Mono', size: 9 },
                            stepSize: 30
                        },
                        title: {
                            display: true,
                            text: 'Pacing BPM',
                            color: '#D29922',
                            font: { family: 'JetBrains Mono', size: 9 }
                        }
                    }
                }
            }
        });
    }

    // 2. Render Scene DNA Cards Grid
    const cardsContainer = document.getElementById('dnaSceneCardsContainer');
    if (!cardsContainer) return;

    cardsContainer.innerHTML = scenePoints.map(pt => {
        const dialoguePct = Math.round(pt.dialogue_density * 100);
        const tensionScore = (pt.tension_score || 0).toFixed(1);
        const hex = pt.color_hex || '#0EA5E9';

        return `
            <div class="col-md-6 col-lg-4">
                <div class="card bg-surface-elevated border rounded-3 p-3 h-100 position-relative overflow-hidden">
                    <div class="position-absolute top-0 start-0 h-100" style="width: 3px; background-color: ${hex};"></div>
                    
                    <div class="d-flex align-items-center justify-content-between mb-2 ps-2">
                        <span class="badge bg-cyan text-white font-mono fw-bold text-xxs">SCENE ${pt.scene_number}</span>
                        <span class="badge font-mono text-xxs" style="background-color: ${hex}20; color: ${hex}; border: 1px solid ${hex}40;">
                            ${pt.emotion_label}
                        </span>
                    </div>

                    <div class="ps-2 mb-3">
                        <div class="d-flex justify-content-between text-xxs font-mono mb-1">
                            <span class="text-muted">DRAMATIC TENSION:</span>
                            <span class="fw-bold text-cyan">${tensionScore} / 10</span>
                        </div>
                        <div class="progress" style="height: 5px;">
                            <div class="progress-bar" style="width: ${pt.tension_score * 10}%; background-color: ${hex};"></div>
                        </div>
                    </div>

                    <div class="ps-2 d-flex align-items-center justify-content-between text-xxs font-mono text-muted border-top pt-2">
                        <span><i class="fa-solid fa-gauge-high me-1 text-warning"></i> ${pt.pacing_bpm} BPM</span>
                        <span><i class="fa-solid fa-comments me-1 text-info"></i> ${dialoguePct}% Dialogue</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderStudioDebate(debate) {
    if (!debate) return;

    const topicEl = document.getElementById('debateTopic');
    if (topicEl) topicEl.innerText = debate.debate_topic || 'Production Optimization';

    const badgeEl = document.getElementById('debateGreenlightBadge');
    if (badgeEl) badgeEl.innerText = debate.greenlight_status || 'GREENLIT';

    const dirEl = document.getElementById('debateDirectorVision');
    if (dirEl) dirEl.innerText = debate.director_vision || 'Creative realism';

    const prodEl = document.getElementById('debateProducerConstraints');
    if (prodEl) prodEl.innerText = debate.producer_constraints || 'Budget guardrails';

    const consensusEl = document.getElementById('debateConsensusAgreement');
    if (consensusEl) consensusEl.innerText = debate.consensus_agreement || 'Production agreed';

    const timeline = document.getElementById('debateDialogueTimeline');
    if (!timeline) return;

    const exchanges = debate.debate_exchanges || [];
    timeline.innerHTML = exchanges.map((ex, idx) => {
        const isDirector = ex.speaker.toLowerCase().includes('director');
        const bubbleClass = isDirector ? 'debate-bubble-director' : 'debate-bubble-producer';
        const icon = isDirector ? '🎬' : '💼';
        const nameColor = isDirector ? 'text-cyan' : 'text-danger';

        return `
            <div class="p-3 ${bubbleClass}">
                <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="fw-bold font-mono ${nameColor} text-xs">${icon} ${ex.speaker} (${ex.stance})</span>
                    <span class="text-xxs text-muted font-mono">ROUND #${idx + 1}</span>
                </div>
                <p class="text-primary-themed text-xs mb-2">"${ex.dialogue}"</p>
                ${ex.compromise_offered ? `
                    <div class="p-2 bg-surface-subtle rounded border text-xxs text-warning font-mono">
                        <i class="fa-solid fa-handshake me-1"></i> Compromise: <span class="text-primary-themed">${ex.compromise_offered}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderRiskMatrix(risks) {
    const container = document.getElementById('riskMatrixContainer');
    if (!container) return;
    container.innerHTML = risks.map(r => {
        let badgeClass = 'bg-warning text-dark';
        if (r.severity === 'CRITICAL' || r.severity === 'HIGH') badgeClass = 'bg-danger text-white';
        if (r.severity === 'LOW') badgeClass = 'bg-info text-white';

        return `
            <div class="col-md-6">
                <div class="card bg-surface-elevated border rounded-3 p-3 h-100">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <span class="fw-bold text-primary-themed font-mono text-xs">${r.category}</span>
                        <span class="badge ${badgeClass} font-mono fw-bold text-xxs">${r.severity} SEVERITY</span>
                    </div>
                    <p class="text-secondary-themed text-xs mb-3">${r.description}</p>
                    <div class="p-2 bg-surface-subtle rounded border text-xxs text-cyan font-mono">
                        <i class="fa-solid fa-shield-cat me-1"></i> Mitigation Protocol:
                        <div class="text-secondary-themed mt-1 text-xs">${r.mitigation_strategy}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderGrafanaTelemetry(telemetry) {
    if (!telemetry) return;

    const latEl = document.getElementById('telemetryLatency');
    if (latEl) latEl.innerText = `${(telemetry.orchestration_latency_ms || 1420).toLocaleString('en-US')} ms`;

    const tokEl = document.getElementById('telemetryTokens');
    if (tokEl) tokEl.innerText = (telemetry.total_tokens_estimated || 3850).toLocaleString('en-US');

    const effEl = document.getElementById('telemetryEfficiency');
    if (effEl) effEl.innerText = `${telemetry.budget_efficiency_score || 9.2} / 10`;

    const safeEl = document.getElementById('telemetrySafety');
    if (safeEl) safeEl.innerText = `${telemetry.safety_compliance_rate || 97.5}%`;

    const jsonEl = document.getElementById('telemetryRawJson');
    if (jsonEl) {
        jsonEl.innerText = JSON.stringify({
            service: "cinemind-agent-orchestrator",
            partner_track: "Grafana Observability",
            metrics: telemetry,
            health: telemetry.pipeline_health || "100% OPERATIONAL",
            timestamp: new Date().toISOString()
        }, null, 2);
    }
}

/* ==========================================================================
   5. Export Utilities (PDF, CSV, JSON)
   ========================================================================== */
function exportStudioBiblePDF() {
    if (!currentBibleData) return;

    logToTerminal('Requesting Studio Pre-Production Bible PDF Report...', 'init');

    fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bible: currentBibleData })
    })
    .then(res => {
        if (!res.ok) throw new Error('Backend PDF endpoint error');
        return res.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const title = (currentBibleData.script_breakdown?.script_title || 'Studio_Bible').replace(/\s+/g, '_');
        a.download = `cinemind_${title}_bible.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        logToTerminal('Studio Bible PDF downloaded successfully via ReportLab engine!', 'agent_complete');
    })
    .catch(err => {
        console.warn('Backend PDF endpoint fallback to html2pdf:', err);
        const element = document.getElementById('printableStudioBible');
        const opt = {
            margin:       [0.4, 0.4, 0.4, 0.4],
            filename:     `CineMind_Studio_Bible_${(currentBibleData.script_breakdown?.script_title || 'Film').replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        if (window.html2pdf) {
            html2pdf().set(opt).from(element).save();
        }
    });
}

function exportCsv(type) {
    if (!currentBibleData) return;

    fetch('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, bible: currentBibleData })
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cinemind_${type}_report.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(err => console.error('CSV Export Error:', err));
}

function exportJSON() {
    if (!currentBibleData) return;
    const title = (currentBibleData.script_breakdown?.script_title || 'Project').replace(/\s+/g, '_');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentBibleData, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `cinemind_${title}_bible.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
}

/* ==========================================================================
   6. Director's Lens, Aspect Ratio & Clipboard Utilities
   ========================================================================== */
function setStoryboardRatio(ratio) {
    document.querySelectorAll('.btn-ratio').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.btn-ratio[data-ratio="${ratio}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const canvases = document.querySelectorAll('.storyboard-preview-canvas');
    canvases.forEach(c => {
        c.classList.remove('ratio-scope', 'ratio-flat', 'ratio-imax', 'ratio-academy');
        if (ratio === '2.39') c.classList.add('ratio-scope');
        else if (ratio === '1.85') c.classList.add('ratio-flat');
        else if (ratio === '1.43') c.classList.add('ratio-imax');
        else if (ratio === '1.33') c.classList.add('ratio-academy');
    });
}

function setLensGrade(filter) {
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.btn-filter[data-filter="${filter}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const canvases = document.querySelectorAll('.storyboard-preview-canvas');
    canvases.forEach(c => {
        c.classList.remove('filter-teal-orange', 'filter-technicolor', 'filter-bleach-bypass', 'filter-noir');
        if (filter !== 'none') {
            c.classList.add(`filter-${filter}`);
        }
    });
}

function copyPrompt(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check text-success"></i>';
        btn.classList.add('btn-cyan');
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('btn-cyan');
        }, 1800);
    }).catch(err => {
        console.error('Clipboard copy failed:', err);
    });
}

/* ==========================================================================
   7. Hollywood Movie Trailer Voiceover Synthesizer
   ========================================================================== */
let trailerSpeechUtterance = null;

function playTrailerVoiceover(loglineText) {
    if (!('speechSynthesis' in window)) {
        console.warn('Web Speech API is not supported in this browser.');
        alert('Web Speech Synthesis is not supported in your browser.');
        return;
    }

    // Cancel any ongoing audio before starting
    window.speechSynthesis.cancel();

    // Determine the narration text
    let textToSpeak = (loglineText && typeof loglineText === 'string') ? loglineText.trim() : '';
    if (!textToSpeak) {
        const loglineEl = document.querySelector('.logline-text') || document.getElementById('overviewLogline');
        if (loglineEl) {
            textToSpeak = loglineEl.innerText.trim();
        }
    }
    if (!textToSpeak && currentBibleData?.executive_pitch?.logline) {
        textToSpeak = currentBibleData.executive_pitch.logline;
    }
    if (!textToSpeak || textToSpeak === 'Logline formulation in progress...') {
        textToSpeak = 'In a world of corporate power and high stakes... CineMind AI presents the ultimate cinematic journey.';
    }

    const title = currentBibleData?.script_breakdown?.script_title || document.getElementById('resScriptTitle')?.innerText || 'CineMind Feature';
    const narrationScript = `In a world of high stakes... CineMind presents: ${title}. ${textToSpeak}`;

    const utterance = new SpeechSynthesisUtterance(narrationScript);
    utterance.rate = 0.85; // Slower theatrical pacing
    utterance.pitch = 0.75; // Deeper dramatic voice pitch

    // Find a suitable English male/narrator voice from window.speechSynthesis.getVoices()
    const voices = window.speechSynthesis.getVoices();
    const narratorVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.toLowerCase().includes('male') || 
         v.name.toLowerCase().includes('david') || 
         v.name.toLowerCase().includes('alex') || 
         v.name.toLowerCase().includes('daniel') || 
         v.name.toLowerCase().includes('george') || 
         v.name.toLowerCase().includes('natural'))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (narratorVoice) {
        utterance.voice = narratorVoice;
    }

    const btns = [document.getElementById('trailerVoBtn'), document.getElementById('btnAuditionTrailerVoice')].filter(Boolean);
    btns.forEach(b => {
        b.classList.add('btn-speaking');
        b.innerHTML = '🎙️ Playing Narration...';
    });

    utterance.onend = () => {
        btns.forEach(b => {
            b.classList.remove('btn-speaking');
            b.innerHTML = '🎙️ Audition Movie Trailer VO';
        });
    };

    utterance.onerror = (err) => {
        console.warn('Speech synthesis error:', err);
        btns.forEach(b => {
            b.classList.remove('btn-speaking');
            b.innerHTML = '🎙️ Audition Movie Trailer VO';
        });
    };

    window.speechSynthesis.speak(utterance);
    trailerSpeechUtterance = utterance;
}

// Ensure globally accessible
window.playTrailerVoiceover = playTrailerVoiceover;

