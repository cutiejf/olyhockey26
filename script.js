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
    // Set --c for the book
    book.style.setProperty('--c', bookState.c);
    // Set --i for each page
    const pages = book.querySelectorAll('.page');
    pages.forEach((page, i) => {
        page.style.setProperty('--i', i);
        page.querySelector('.front')?.addEventListener('click', () => bookNext());
        page.querySelector('.back')?.addEventListener('click', () => bookPrev());
    });

    // Update page number display
    updatePageNum();

    // Controls
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn && nextBtn) {
        prevBtn.onclick = bookPrev;
        nextBtn.onclick = bookNext;
    }
}

function bindPages() {
    // No longer needed; handled in initBook()
}

function bookNext() {
    const book = document.querySelector('.book');
    const pages = book.querySelectorAll('.page');
    bookState.c = Math.min(bookState.c + 1, pages.length - 1);
    book.style.setProperty('--c', bookState.c);
    updatePageNum();
}

function bookPrev() {
    const book = document.querySelector('.book');
    const pages = book.querySelectorAll('.page');
    bookState.c = Math.max(bookState.c - 1, 0);
    book.style.setProperty('--c', bookState.c);
    updatePageNum();
}

function updatePageNum() {
    const pageNum = document.getElementById('page-num');
    const book = document.querySelector('.book');
    if (!pageNum || !book) return;
    const pages = book.querySelectorAll('.page');
    pageNum.textContent = `Page ${bookState.c + 1} / ${pages.length}`;
}

function updatePageDisplay() {
    // No longer needed; handled in bookNext/bookPrev
}

function renderContent() {
    const scoresDisplay = document.getElementById('scores-display');
    const statsDisplay = document.getElementById('stats-display');
    
    if (!scoresDisplay || !statsDisplay) return;
    
    // Build schedule from prelims + knockouts and group by date
    const games = [];
    const addGamesFrom = (arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((g) => {
            if (g && g.id) games.push(g);
        });
    };
    addGamesFrom(window_data.prelims);
    addGamesFrom(window_data.knockouts);

    const monthMap = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    const parseShortDate = (dstr) => {
        if (!dstr) return null;
        // Expect formats like "Wed Feb 11" or "Tue Feb 17"
        const m = dstr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
        if (!m) return null;
        const mon = m[1].slice(0,1).toUpperCase() + m[1].slice(1).toLowerCase();
        const day = parseInt(m[2], 10);
        const year = (new Date()).getFullYear();
        return new Date(year, monthMap[mon], day);
    };

    const byDate = {};
    games.forEach((g) => {
        const dt = parseShortDate(g.d);
        if (!dt) return;
        const key = dt.toISOString().slice(0,10);
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(g);
    });

    const sortedDates = Object.keys(byDate).sort();
    const today = new Date();
    today.setHours(0,0,0,0);
    const dayKey = (d) => d.toISOString().slice(0,10);
    const dayDiff = (d1, d2) => Math.round((d1 - d2) / 86400000);

    let scoresHTML = '';

    // Helper to render a date group
    const renderGroup = (d, label) => {
        const key = dayKey(d);
        const group = byDate[key] || [];
        scoresHTML += `<div style="margin-bottom:8px;"><div style="font-weight:700; font-size:12px;">${label}</div>`;
        if (!group.length) {
            scoresHTML += `<div style="text-align:center; color:#800000; font-size:15px; padding:8px 0; margin:6px 0 8px 0; font-weight:800;">DAY BREAK - NO GAMES</div>`;
            // (optional) small centered note below day break can be appended here when needed
        } else {
            scoresHTML += '<table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#f8f8f8;"><th style="padding:4px; text-align:left;">Time</th><th style="padding:4px; text-align:left;">Match</th><th style="padding:4px; text-align:center;">Score</th></tr></thead><tbody>';
            group.forEach((g) => {
                const scoreHome = (window_data.storedScores && window_data.storedScores[`${g.id}-h`]) || '';
                const scoreAway = (window_data.storedScores && window_data.storedScores[`${g.id}-a`]) || '';
                const scoreText = (scoreHome || scoreAway) ? `${scoreHome || '-'} - ${scoreAway || '-'}` : '';
                scoresHTML += `<tr><td style="padding:6px; border-bottom:1px solid #eee; width:70px;">${g.t || ''}</td><td style="padding:6px; border-bottom:1px solid #eee;">${g.h} vs ${g.a}</td><td style="padding:6px; border-bottom:1px solid #eee; text-align:center;">${scoreText}</td></tr>`;
            });
            scoresHTML += '</tbody></table>';
        }
        scoresHTML += '</div>';
    };

    // Render Yesterday, Today, Tomorrow in that order
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    renderGroup(yesterday, "Yesterdays");
    renderGroup(today, "Todays");
    renderGroup(tomorrow, "Tomorrow's");

    // (NEXT GAME DAY summary removed)

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
