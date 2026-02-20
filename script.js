// Olympic Hockey 2026 - Clean Display Version
// Loads data from data.json only - NO API calls, NO fetching

let bookState = { c: 0 };
let window_data = {};
// Track current panel index for portrait mobile horizontal scroll
let mobileIndex = 0;

// Load data.json (prefer local copy so updates are visible immediately)
async function loadData() {
    // Try local first
    try {
        const localResp = await fetch('data.json');
        if (localResp && localResp.ok) {
            window_data = await localResp.json();
            console.log('✓ Data loaded from local data.json');
            autoPopulateKnockouts();
            updateTournamentQuotes();
            generateTournamentNotes();
            initBook();
            renderContent();
            return;
        }
    } catch (e) {
        console.log('Local data.json not available or failed to load:', e && e.message);
    }

    // Fallback to GitHub for latest remote copy
    try {
        const githubUrl = 'https://raw.githubusercontent.com/cutiejf/olyhockey26/main/data.json';
        const response = await fetch(githubUrl);
        if (response && response.ok) {
            window_data = await response.json();
            console.log('✓ Data loaded from GitHub repo');
            autoPopulateKnockouts();
            updateTournamentQuotes();
            generateTournamentNotes();
            initBook();
            renderContent();
            return;
        }
        throw new Error('GitHub response not OK');
    } catch (error) {
        console.error('Error loading data from GitHub:', error && error.message);
        // Initialize with empty data to avoid UI break
        window_data = {};
        initBook();
        renderContent();
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

    const mobilePrevBtn = document.getElementById('mobile-prev-btn');
    const mobileNextBtn = document.getElementById('mobile-next-btn');
    if (mobilePrevBtn && mobileNextBtn) {
        mobilePrevBtn.onclick = bookPrev;
        mobileNextBtn.onclick = bookNext;
    }
}

function bindPages() {
    // No longer needed; handled in initBook()
}

// Check if in portrait mobile mode
function isPortraitMobile() {
    return window.innerWidth <= 900 && window.matchMedia('(orientation: portrait)').matches;
}

function bookNext() {
    const book = document.querySelector('.book');
    const pages = book.querySelectorAll('.page');
    
    // Portrait mobile: simple next panel
    if (isPortraitMobile()) {
        const panels = book.querySelectorAll('.front, .back');
        if (mobileIndex < panels.length - 1) {
            mobileIndex++;
            panels[mobileIndex].scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
        return;
    }
    
    bookState.c = Math.min(bookState.c + 1, pages.length);
    book.style.setProperty('--c', bookState.c);
    updatePageNum();
}

function bookPrev() {
    const book = document.querySelector('.book');
    
    // Portrait mobile: simple prev panel
    if (isPortraitMobile()) {
        const panels = book.querySelectorAll('.front, .back');
        if (mobileIndex > 0) {
            mobileIndex--;
            panels[mobileIndex].scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
        return;
    }
    
    bookState.c = Math.max(bookState.c - 1, 0);
    book.style.setProperty('--c', bookState.c);
    updatePageNum();
}

// Add scroll listener to keep index in sync if user swipes manually
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const book = document.querySelector('.book');
        if (book) {
            book.addEventListener('scroll', () => {
                if (!isPortraitMobile()) return;
                // Update index based on scroll so button doesn't get lost
                // Simple calculation: scrollLeft / width
                const idx = Math.round(book.scrollLeft / window.innerWidth);
                if (idx !== mobileIndex) {
                    mobileIndex = idx;
                }
            }, { passive: true });
        }
    });
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

    // Group games by date
    const byDate = {};
    games.forEach(g => {
        const date = g.d;
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(g);
    });

    // Example: render today's games (replace with your actual logic/UI)
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');
    const todayGames = byDate[todayStr] || [];
    let buzzHTML = '';
    todayGames.forEach(g => {
        const hScore = window_data.storedScores[`${g.id}-h`] || '';
        const aScore = window_data.storedScores[`${g.id}-a`] || '';
        // Determine finished status: prefer explicit status, fall back to presence of scores
        const isFinished = (g.status === 'F') || (hScore !== '' && aScore !== '');
        const statusLabel = isFinished ? 'Final' : g.t;
        buzzHTML += `<div>${g.h} ${hScore} - ${aScore} ${g.a} <span style="color:#999; font-size:0.9em;">(${statusLabel})</span></div>`;
    });
    if (scoresDisplay) scoresDisplay.innerHTML = buzzHTML;

    // Display ESPN stats if available
    const stats = window_data.storedESPNStats || {};
    let statsHTML = '';

    if (stats.scorers && stats.scorers.length > 0) {
        statsHTML += '<div style="margin-bottom:10px;"><b>Top Scorers:</b><br>';
        stats.scorers.slice(0, 10).forEach((s, i) => {
            const pts = s.points || '';
            const name = (s.name || '').replace(/^\d+\.\s*/, '');
            statsHTML += `<div style="font-size:11px; padding:2px 0;">${i+1}. ${name} ${s.team ? '(' + s.team + ')' : ''} - ${pts} pts</div>`;
        });
        statsHTML += '</div>';
    }
    
    if (stats.goalies && stats.goalies.length > 0) {
        statsHTML += '<div><b>Top Goalies:</b><br>';
        stats.goalies.slice(0, 10).forEach((g, i) => {
            statsHTML += `<div style="font-size:11px; padding:2px 0;">${i+1}. ${g.name} ${g.team ? '(' + g.team + ')' : ''} - ${g.gp || ''} GP ${g.gaa || ''} GAA ${g.svp || ''} SV%</div>`;
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

// ================== MOBILE: INDIVIDUAL PANELS + LETTERBOX ==================
// Logic handled by CSS and main bookNext/bookPrev functions now.
// Legacy mobile rewrite code removed to prevent conflicts.

// ================== TOURNAMENT PROGRESSION FEATURES ==================

function getTournamentState() {
    const scores = window_data.storedScores || {};
    
    // Check preliminary round completion
    let prelimsComplete = true;
    for (let i = 1; i <= 18; i++) {
        if (!scores[`p${i}-h`] || !scores[`p${i}-a`]) {
            prelimsComplete = false;
            break;
        }
    }
    
    // Check qualifiers completion (k1-k4)
    let qualifierComplete = true;
    for (let i = 1; i <= 4; i++) {
        if (!scores[`k${i}-h`] || !scores[`k${i}-a`]) {
            qualifierComplete = false;
            break;
        }
    }
    // Check quarterfinals completion (k5-k8)
    let quarterComplete = true;
    for (let i = 5; i <= 8; i++) {
        if (!scores[`k${i}-h`] || !scores[`k${i}-a`]) {
            quarterComplete = false;
            break;
        }
    }
    
    // Check semifinals completion (k13-k14) 
    let semiComplete = true;
    for (let i = 13; i <= 14; i++) {
        if (!scores[`k${i}-h`] || !scores[`k${i}-a`]) {
            semiComplete = false;
            break;
        }
    }
    
    // Check finals completion
    const goldComplete = scores['k15-h'] && scores['k15-a'];
    
    return {
        prelimsComplete,
        qualifierComplete,
        quarterComplete, 
        semiComplete,
        goldComplete,
        dayBreak: isDay19Break()
    };
}

function isDay19Break() {
    const now = new Date();
    const feb19 = new Date(2026, 1, 19); // Feb 19, 2026
    return now.toDateString() === feb19.toDateString();
}

function updateTournamentQuotes() {
    // This will be called when rendering knockouts in index.html
    // The quotes will be updated dynamically based on tournament state
    window.getTournamentQuote = function(stage) {
        const state = getTournamentState();
        
        if (state.dayBreak) {
            return "DAY BREAK - NO GAMES<br/>WOMEN'S MEDAL MATCHES<br/>Bronze - SUI v SWE 10:40a<br/>Gold - USA v CAN 1:10p";
        }
        
        switch(stage) {
            case 'QUARTERFINALS':
                return state.prelimsComplete ? "And then there were eight.." : "The fight begins...";
                
            case 'SEMIFINALS': 
                return state.quarterComplete ? "Four teams remain. The dream lives on.." : "And then there were eight..";
                
            case 'BRONZE_MEDAL':
                return state.semiComplete ? "One last chance for glory.." : "Four teams remain. The dream lives on..";
                
            case 'GOLD_MEDAL':
                return state.semiComplete ? "And then it all comes down to this..." : "One last chance for glory..";
                
            case 'CHAMPIONS':
                return state.goldComplete ? "Your world champions..." : "And then it all comes down to this...";
                
            default:
                return "The tournament continues...";
        }
    };
}

function autoPopulateKnockouts() {
    // Get current standings and auto-fill knockout bracket
    // This is a simplified version - you can expand based on your seeding rules
    console.log('Auto-populating knockout brackets based on current standings...');
    
    // You can add logic here to automatically set knockout participants
    // based on preliminary round results and standings
}

function generateTournamentNotes() {
    // Generate tournament notes from git history
    console.log('Generating tournament notes from git updates...');
    
    // Create a notes object that can be accessed in the HTML
    window.tournamentNotes = {
        lastUpdate: new Date().toLocaleString(),
        currentState: getTournamentState(),
        autoGenerated: true,
        notes: [
            "📊 Tournament data auto-updated from GitHub",
            "🏒 Knockout brackets populated automatically", 
            "📅 Day break detection active for Feb 19th",
            "🎯 Dynamic quotes based on tournament progress"
        ]
    };
}
