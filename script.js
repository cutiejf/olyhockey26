// Olympic Hockey 2026 - Clean Display Version
// Loads data from data.json only - NO API calls, NO fetching

let bookState = { c: 0 };
let window_data = {};

// Load data.json on start
async function loadData() {
    try {
        const response = await fetch('data.json');
        window_data = await response.json();
        console.log('✓ Data loaded from data.json');
        initBook();
    } catch (error) {
        console.error('Error loading data.json:', error);
        initBook(); // Still initialize with empty data
    }
}

function initBook() {
    const book = document.querySelector('.book');
    if (!book) return;
    
    // Simple page structure - just display data from JSON
    const pages = [
        `<div class="page"><div class="front cover" style="background:linear-gradient(135deg, #1a1a1a, #2c2c2c); display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff;">
            <div style="text-align:center;">
                <div style="font-size:48px; font-weight:100; letter-spacing:12px;">2026</div>
                <div style="font-size:14px; font-weight:900; letter-spacing:2px; margin-top:10px;">OLYMPIC MEN'S HOCKEY</div>
            </div>
        </div><div class="back" style="padding:15px;"><h2>Data Info</h2><p style="font-size:11px;">This is a live display powered by data.json. Upload new data to update scores automatically.</p></div></div>`,
        
        `<div class="page"><div class="front" style="padding:15px;"><h2>Scores</h2><div id="scores-display" style="flex:1; overflow:auto; font-size:10px;"></div></div><div class="back" style="padding:15px;"><h2>Stats</h2><div id="stats-display" style="flex:1; overflow:auto; font-size:10px;"></div></div></div>`
    ];
    
    book.innerHTML = pages.join('');
    bindPages();
    renderContent();
}

function bindPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach((page, i) => {
        page.style.setProperty('--i', i);
        page.addEventListener('click', (e) => {
            if (e.target.closest('.front')) bookNext();
            if (e.target.closest('.back')) bookPrev();
        });
    });
    updatePageDisplay();
}

function bookNext() {
    bookState.c = Math.min(bookState.c + 1, document.querySelectorAll('.page').length - 1);
    updatePageDisplay();
}

function bookPrev() {
    bookState.c = Math.max(bookState.c - 1, 0);
    updatePageDisplay();
}

function updatePageDisplay() {
    document.querySelector('.book').style.setProperty('--c', bookState.c);
    const pages = ['COVER', 'SCORES & STATS'];
    document.getElementById('page-display').textContent = pages[bookState.c] || 'PAGE ' + (bookState.c + 1);
}

function renderContent() {
    const scoresDisplay = document.getElementById('scores-display');
    const statsDisplay = document.getElementById('stats-display');
    
    if (!scoresDisplay || !statsDisplay) return;
    
    // Display scores
    const scores = window_data.storedScores || {};
    let scoresHTML = '<table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#f0f0f0;"><th style="padding:3px;">Game</th><th>Home</th><th>Away</th></tr></thead><tbody>';
    
    Object.entries(scores).forEach(([key, val]) => {
        scoresHTML += `<tr><td style="padding:3px; border-bottom:1px solid #eee;">${key}</td><td style="text-align:center;">${val || '-'}</td></tr>`;
    });
    
    scoresHTML += '</tbody></table>';
    scoresDisplay.innerHTML = scoresHTML;
    
    // Display ESPN stats if available
    const stats = window_data.storedESPNStats || {};
    let statsHTML = '';
    
    if (stats.scorers && stats.scorers.length > 0) {
        statsHTML += '<div style="margin-bottom:10px;"><b>Top Scorers:</b><br>';
        stats.scorers.slice(0, 3).forEach((s, i) => {
            statsHTML += `<div style="font-size:9px; padding:2px 0;">${i+1}. ${s.name} (${s.team}) - ${s.points}pts</div>`;
        });
        statsHTML += '</div>';
    }
    
    if (stats.goalies && stats.goalies.length > 0) {
        statsHTML += '<div><b>Top Goalies:</b><br>';
        stats.goalies.slice(0, 3).forEach((g, i) => {
            statsHTML += `<div style="font-size:9px; padding:2px 0;">${i+1}. ${g.name} (${g.team}) - ${g.wins}W ${g.gaa}GAA</div>`;
        });
        statsHTML += '</div>';
    }
    
    if (!statsHTML) {
        statsHTML = '<div style="color:#999; font-size:9px;">No ESPN stats loaded yet. Upload new data.json with stats.</div>';
    }
    
    statsDisplay.innerHTML = statsHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', loadData);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') bookPrev();
    if (e.key === 'ArrowRight') bookNext();
});

// Refresh button (if called, does nothing - display only)
window.refreshScores = function() {
    alert('This is the clean display version. Update data.json to change scores.');
};
