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
