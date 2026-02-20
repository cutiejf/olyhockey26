/**
 * Hockey Guide 2026 - Book Module
 * Page turning and rendering logic with jQuery
 */

(function($, window) {
    'use strict';

    // ========== Data (loaded from data.json or inline) ==========
    var HockeyData = window.HockeyData || {};
    
    var masterSpreads = HockeyData.masterSpreads || [
        ['p1'], ['p_intro', 'p2'], ['p3', 'p4'], ['p_rules', 'p5'],
        ['p_new8', 'p6'], ['p7', 'p8'], ['p9', 'p10'], ['p11', 'p_outro'], ['p12']
    ];
    
    var flagMap = HockeyData.flagMap || {
        'Canada': 'ca', 'Czechia': 'cz', 'Switzerland': 'ch', 'France': 'fr',
        'Finland': 'fi', 'Sweden': 'se', 'Slovakia': 'sk', 'Italy': 'it',
        'USA': 'us', 'Germany': 'de', 'Latvia': 'lv', 'Denmark': 'dk'
    };
    
    var storedScores = HockeyData.storedScores || {};
    var prelims = HockeyData.prelims || [];
    var knockouts = HockeyData.knockouts || [];
    var historyData = HockeyData.historyData || [];

    // ========== State ==========
    var spreadIdx = 0;
    var isAnimating = false;

    // ========== Utilities ==========
    function isMobile() {
        return window.innerWidth <= 768;
    }

    function getActiveSpreads() {
        if (!isMobile()) return masterSpreads;
        var flattened = [];
        masterSpreads.forEach(function(s) {
            s.forEach(function(p) { flattened.push([p]); });
        });
        return flattened;
    }

    window.getFlagImg = function(name) {
        var code = 'ca';
        for (var key in flagMap) {
            if (name.indexOf(key) !== -1) { code = flagMap[key]; break; }
        }
        return '<img src="https://flagcdn.com/w20/' + code + '.png" class="flag-icon">';
    };

    window.getGrpColor = function(grp) {
        return grp === 'A' ? 'var(--accent-red)' : grp === 'B' ? 'var(--accent-blue)' : grp === 'C' ? 'var(--accent-green)' : 'inherit';
    };

    // ========== Sound ==========
    function playPageSound() {
        var $sound = $('#pageTurn');
        if ($sound.length) {
            try {
                $sound[0].volume = 0.6;
                $sound[0].currentTime = 0;
                $sound[0].play().catch(function() {});
            } catch (e) {}
        }
    }

    // ========== Table Injection ==========
    function injectTablesTo(container) {
        var $container = $(container);
        
        // Preliminaries
        var $pBody = $container.find('#sched-prelims-v');
        if ($pBody.length) {
            $pBody.empty();
            prelims.forEach(function(g) {
                var tr = '<tr>' +
                    '<td class="c-grp" style="padding:6px 0; color:' + window.getGrpColor(g.g) + '">' + g.g + '</td>' +
                    '<td class="c-ven">' + g.v + '</td>' +
                    '<td class="c-date">' + g.d + '</td>' +
                    '<td class="c-time">' + g.t + '</td>' +
                    '<td class="c-match">' +
                        '<span class="team-home">' + g.h.substring(0,3).toUpperCase() + ' ' + window.getFlagImg(g.h) + '</span>' +
                        '<span class="score-area">' +
                            '<span class="sb" contenteditable="true" data-key="' + g.id + '-h">' + (storedScores[g.id + '-h'] || '') + '</span>' +
                            '<span class="sb" contenteditable="true" data-key="' + g.id + '-a">' + (storedScores[g.id + '-a'] || '') + '</span>' +
                        '</span>' +
                        '<span class="team-away">' + window.getFlagImg(g.a) + ' ' + g.a.substring(0,3).toUpperCase() + '</span>' +
                    '</td></tr>';
                $pBody.append(tr);
            });
        }
        
        // Knockouts
        var $kBody = $container.find('#sched-ko-v');
        if ($kBody.length) {
            $kBody.empty();
            knockouts.forEach(function(g) {
                var tr;
                if (g.header) {
                    tr = '<tr><td colspan="5" style="background:#f4f4f4; text-align:center; font-weight:900; font-size:12px; border-bottom:1px solid #000; padding:3.2px;">' + g.header + '</td></tr>';
                } else {
                    tr = '<tr>' +
                        '<td class="c-grp" style="padding:8.8px 0">' + g.g + '</td>' +
                        '<td class="c-ven">' + g.v + '</td>' +
                        '<td class="c-date" style="width:95px;">' + g.d + '</td>' +
                        '<td class="c-time">' + g.t + '</td>' +
                        '<td class="c-match">' +
                            '<span class="team-home">' + g.h + '</span>' +
                            '<span class="score-area">' +
                                '<span class="sb" contenteditable="true" data-key="' + g.id + '-h">' + (storedScores[g.id + '-h'] || '') + '</span>' +
                                '<span class="sb" contenteditable="true" data-key="' + g.id + '-a">' + (storedScores[g.id + '-a'] || '') + '</span>' +
                            '</span>' +
                            '<span class="team-away">' + g.a + '</span>' +
                        '</td></tr>';
                }
                $kBody.append(tr);
            });
        }
        
        // Daily Buzz
        var _today = new Date();
        var _yesterday = new Date(_today); _yesterday.setDate(_today.getDate() - 1);
        var _tomorrow = new Date(_today); _tomorrow.setDate(_today.getDate() + 1);
        function _fmtDate(d) {
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');
        }
        var todayStr = _fmtDate(_today);
        var yesterdayStr = _fmtDate(_yesterday);
        var tomorrowStr = _fmtDate(_tomorrow);
        var allGames = (prelims || []).concat(knockouts || []).filter(function(g) { return g && g.id && !g.header; });
        
        var $yBuzz = $container.find('#yesterday-buzz-v');
        if ($yBuzz.length) {
            $yBuzz.empty();
            allGames.filter(function(m) { return m.d === yesterdayStr; }).forEach(function(m) {
                var div = '<div style="display:flex; align-items:center; font-size:16px; font-weight:bold; color:#111;">' +
                    '<span style="width:50px;"><span style="background:#eee; padding:2px 4px; border-radius:2px; font-size:10px; color:#666;">GRP ' + m.g + '</span></span>' +
                    '<span style="flex:1; text-align:right;">' + m.h.substring(0,3).toUpperCase() + ' ' + window.getFlagImg(m.h) + '</span>' +
                    '<span style="width:60px; text-align:center; background:#000; color:#fff; margin:0 12px; border-radius:4px; padding:3px 0; font-size:17px;">' + 
                        (storedScores[m.id + '-h'] || '0') + '-' + (storedScores[m.id + '-a'] || '0') + '</span>' +
                    '<span style="flex:1; text-align:left;">' + window.getFlagImg(m.a) + ' ' + m.a.substring(0,3).toUpperCase() + '</span>' +
                '</div>';
                $yBuzz.append(div);
            });
        }
        
        var $tBuzz = $container.find('#today-buzz-v');
        if ($tBuzz.length) {
            $tBuzz.empty();
            allGames.filter(function(m) { return m.d === todayStr; }).forEach(function(m) {
                var div = '<div style="display:flex; align-items:center; font-size:16px; font-weight:bold; color:#111;">' +
                    '<span style="width:40px; text-align:left;"><span style="background:#eee; padding:2px 4px; border-radius:2px; font-size:10px; color:#666;">GRP ' + m.g + '</span></span>' +
                    '<span style="width:60px; font-size:14px; color:var(--accent-red); font-weight:900; text-align:center;">' + m.t + '</span>' +
                    '<span style="flex:1; text-align:right;">' + m.h.substring(0,3).toUpperCase() + ' ' + window.getFlagImg(m.h) + '</span>' +
                    '<span style="width:60px; text-align:center; background:#000; color:#fff; margin:0 12px; border-radius:4px; padding:3px 0; font-size:17px;">' + 
                        (storedScores[m.id + '-h'] || '0') + '-' + (storedScores[m.id + '-a'] || '0') + '</span>' +
                    '<span style="flex:1; text-align:left;">' + window.getFlagImg(m.a) + ' ' + m.a.substring(0,3).toUpperCase() + '</span>' +
                '</div>';
                $tBuzz.append(div);
            });
        }
        
        // History
        var $hBody = $container.find('#history-v');
        if ($hBody.length) {
            $hBody.empty();
            historyData.forEach(function(r) {
                var yr = r[0];
                if (yr === '2018' || yr === '2022') yr += '<span style="color:#c0392b;">*</span>';
                var tr = '<tr>' +
                    '<td>' + yr + '</td>' +
                    '<td><img src="https://flagcdn.com/w20/' + r[1] + '.png" class="flag-icon"> ' + r[2] + '</td>' +
                    '<td><img src="https://flagcdn.com/w20/' + r[3] + '.png" class="flag-icon"> ' + r[4] + '</td>' +
                    '<td><img src="https://flagcdn.com/w20/' + r[5] + '.png" class="flag-icon"> ' + r[6] + '</td>' +
                '</tr>';
                $hBody.append(tr);
            });
        }
    }

    // ========== Render ==========
    function renderTo(targetId, idx) {
        var $container = $('#' + targetId);
        if (!$container.length) return;
        
        $container.empty();
        var currentSpreads = getActiveSpreads();
        if (idx < 0) idx = 0;
        if (idx >= currentSpreads.length) idx = currentSpreads.length - 1;
        
        var spread = currentSpreads[idx];

        // Cover page (spread 0) on desktop
        if (!isMobile() && idx === 0) {
            $container.addClass('is-closed').removeClass('is-open single-page');
            
            // Only show the cover - no left placeholder visible
            // The flap sits on top of everything
            var $flap = $('<div class="cover-flap">');
            
            var $front = $('<div class="face front">');
            $front.append($('#p1').clone());
            
            var $back = $('<div class="face back">');
            $back.html('<div class="panel" style="background:#e8e8e8; display:flex; justify-content:center; align-items:center;"><h3>Inside Cover</h3></div>');
            
            $flap.append($front).append($back);
            $container.append($flap);
            
            $('#page-display').text('COVER');
            injectTablesTo($container[0]);
            return;
        }

        var $leftDiv = $('<div class="left-page">');
        var $rightDiv = $('<div class="right-page">');
        var leftPanel = null, rightPanel = null;

        if (spread.length === 1) {
            $container.addClass('single-page');
            var $panelClone = $('#' + spread[0]).clone();
            if (isMobile()) {
                leftPanel = $panelClone;
            } else if (idx === currentSpreads.length - 1) {
                leftPanel = $panelClone;
            } else {
                rightPanel = $panelClone;
            }
        } else {
            $container.removeClass('single-page');
            leftPanel = $('#' + spread[0]).clone();
            rightPanel = $('#' + spread[1]).clone();
        }

        if (leftPanel) {
            $leftDiv.append(leftPanel).append('<div class="back">');
            $container.append($leftDiv);
        }
        if (rightPanel) {
            $rightDiv.append(rightPanel).append('<div class="back">');
            $container.append($rightDiv);
        }

        $container.removeClass('is-closed is-open');

        // Page numbering
        var absPageNumStart;
        if (isMobile()) {
            absPageNumStart = idx + 1;
            $('#page-display').text(absPageNumStart);
        } else {
            var count = 0;
            for (var i = 0; i < idx; i++) count += masterSpreads[i].length;
            absPageNumStart = count + 1;
            $('#page-display').text(spread.length === 1 ? absPageNumStart : absPageNumStart + ' | ' + (absPageNumStart + 1));
        }

        // Inject tables
        setTimeout(function() {
            injectTablesTo($container[0]);
        }, 50);
    }

    window.renderBook = function() {
        renderTo('spread-container', spreadIdx);
    };

    // ========== Page Turning with CSS 3D Animation ==========
    // Use Untitled-1 style logic for the cover (open/close),
    // and simple instant jumps for inner spreads for now.
    
    window.nextSpread = function() {
        if (isAnimating) return;
        
        var currentSpreads = getActiveSpreads();
        if (spreadIdx >= currentSpreads.length - 1) return;
        
        playPageSound();
        
        // Desktop cover opening animation (from closed cover to first spread)
        if (!isMobile() && spreadIdx === 0) {
            var $sc = $('#spread-container');
            var sc = $sc[0];
            if (!sc) return;

            var $flap = $sc.find('.cover-flap');
            if (!$flap.length) {
                // Fallback: just jump
                spreadIdx = 1;
                window.renderBook();
                return;
            }

            isAnimating = true;

            // Start the coordinated move+flip
            $sc.removeClass('is-closed').addClass('is-open');
            $flap.addClass('flipped');

            var handled = false;
            var onEnd = function(e) {
                var prop = e.originalEvent ? e.originalEvent.propertyName : e.propertyName;
                if (prop && prop !== 'transform') return;
                if (handled) return;
                handled = true;

                $sc.off('transitionend', onEnd);
                spreadIdx = 1;
                isAnimating = false;
                window.renderBook();
            };

            $sc.on('transitionend', onEnd);
            return;
        }

        // Inner spreads: simple jump for now
        spreadIdx++;
        window.renderBook();
    };

    window.prevSpread = function() {
        if (isAnimating || spreadIdx <= 0) return;
        
        playPageSound();
        
        // Desktop cover closing animation (from first spread back to cover)
        if (!isMobile() && spreadIdx === 1) {
            var $sc = $('#spread-container');
            var sc = $sc[0];
            if (!sc) return;

            isAnimating = true;

            // Build a temporary "open cover" scene: right page + flipped flap
            $sc.empty();

            var spreads = getActiveSpreads();
            var secondSpread = spreads[1] || [];
            var rightId = secondSpread.length > 1 ? secondSpread[1] : secondSpread[0];
            if (rightId) {
                var $right = $('<div class="right-page">');
                $right.append($('#' + rightId).clone());
                $sc.append($right);
            }

            var $flap = $('<div class="cover-flap">');
            var $front = $('<div class="face front">');
            $front.append($('#p1').clone());

            var $back = $('<div class="face back">');
            $back.html('<div class="panel" style="background:#e8e8e8; display:flex; justify-content:center; align-items:center;"><h3>Inside Cover</h3></div>');

            $flap.append($front).append($back);
            $sc.append($flap);

            $sc.removeClass('is-closed').addClass('is-open');
            $flap.addClass('flipped');

            // Force layout
            void sc.offsetWidth;

            // Trigger close animation
            $sc.removeClass('is-open').addClass('is-closed');
            $flap.removeClass('flipped');

            var handledClose = false;
            var onEndClose = function(e) {
                var prop = e.originalEvent ? e.originalEvent.propertyName : e.propertyName;
                if (prop && prop !== 'transform') return;
                if (handledClose) return;
                handledClose = true;

                $sc.off('transitionend', onEndClose);
                spreadIdx = 0;
                isAnimating = false;
                window.renderBook();
            };

            $sc.on('transitionend', onEndClose);
            return;
        }

        // Inner spreads: simple jump for now
        spreadIdx--;
        window.renderBook();
    };

    // ========== Input Handler ==========
    window.handleInput = function(el, key) {
        var val = $(el).text().trim();
        storedScores[key] = val;
        // Could trigger cloud save here
    };

    // ========== Swipe & Keyboard ==========
    $(document).ready(function() {
        var touchStartX = 0, touchStartY = 0;
        var minSwipeDistance = 50;
        
        $(document).on('touchstart', '#spread-container, .book-spread', function(e) {
            var touch = e.originalEvent.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        $(document).on('touchend', '#spread-container, .book-spread', function(e) {
            var touch = e.originalEvent.changedTouches[0];
            var deltaX = touch.clientX - touchStartX;
            var deltaY = touch.clientY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX < 0) {
                    window.nextSpread();
                } else {
                    window.prevSpread();
                }
            }
        });
        
        $(document).on('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                window.nextSpread();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                window.prevSpread();
            }
        });
        
        // Score input handler
        $(document).on('input', '.sb[contenteditable]', function() {
            var key = $(this).data('key');
            if (key) window.handleInput(this, key);
        });
    });

    // ========== Resize Handler ==========
    $(window).on('resize', function() {
        window.renderBook();
    });

    // ========== Audio Priming ==========
    $(document).one('click', function() {
        var $s = $('#pageTurn');
        if ($s.length) {
            try {
                $s[0].volume = 1.0;
                $s[0].play().then(function() {
                    $s[0].pause();
                    $s[0].currentTime = 0;
                }).catch(function() {});
            } catch (e) {}
        }
    });

    // ========== Expose for external use ==========
    window.HockeyBook = {
        setData: function(data) {
            if (data.masterSpreads) masterSpreads = data.masterSpreads;
            if (data.flagMap) flagMap = data.flagMap;
            if (data.storedScores) storedScores = data.storedScores;
            if (data.prelims) prelims = data.prelims;
            if (data.knockouts) knockouts = data.knockouts;
            if (data.historyData) historyData = data.historyData;
        },
        render: function() {
            window.renderBook();
        },
        goToSpread: function(idx) {
            spreadIdx = idx;
            window.renderBook();
        },
        getSpreadIndex: function() {
            return spreadIdx;
        }
    };

    // ========== Initialize on load ==========
    $(document).ready(function() {
        window.renderBook();
        $('body').addClass('js-ready');
    });

})(jQuery, window);
