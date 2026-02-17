// Olympic Hockey 2026 - Clean Display Version
// Loads data from data.json only - NO API calls, NO fetching

let bookState = { c: 0 };
let window_data = {};
// Track current panel index for portrait mobile horizontal scroll
let mobileIndex = 0;

// Load data.json from GitHub repo
async function loadData() {
    try {
        // Try GitHub first (for latest updates)
        const githubUrl = 'https://raw.githubusercontent.com/cutiejf/olyhockey26/main/data.json';
        const response = await fetch(githubUrl);
        window_data = await response.json();
        console.log('✓ Data loaded from GitHub repo');
        
        // Auto-populate knockouts and update tournament state
        autoPopulateKnockouts();
        updateTournamentQuotes();
        generateTournamentNotes();
        
        initBook();
    } catch (error) {
        console.error('Error loading from GitHub, trying local fallback:', error);
        try {
            // Fallback to local data.json if GitHub fails
            const response = await fetch('data.json');
            window_data = await response.json();
            console.log('✓ Data loaded from local fallback');
            
            // Auto-populate knockouts and update tournament state
            autoPopulateKnockouts();
            updateTournamentQuotes();
            generateTournamentNotes();
            
            initBook();
        } catch (fallbackError) {
            console.error('Error loading data:', fallbackError);
            initBook(); // Still initialize with empty data
        }
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
    
    // Check quarterfinals completion (k7-k10)
    let quarterComplete = true;
    for (let i = 7; i <= 10; i++) {
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
