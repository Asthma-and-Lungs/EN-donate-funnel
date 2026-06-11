/**
 * ALUK Dynamic Background Switcher (Zero-Lag Hide/Show)
 * Updated to support both Page_UTM and Page-only fallbacks
 * Hosted on GitHub
 */
(function() {
    const csvUrl = 'https://raw.githubusercontent.com/Asthma-and-Lungs/EN-donate-funnel/refs/heads/main/data/en_image_list_live.csv';
    
    // 1. Extract UTM Campaign
    const urlParams = new URLSearchParams(window.location.search);
    const utmCampaign = urlParams.get('utm_campaign');

    // 2. Extract Page Number from URL path (e.g., /page/190488/donate/1)
    const pathSegments = window.location.pathname.split('/');
    const pageIndex = pathSegments.indexOf('page');
    const pageNumber = (pageIndex !== -1 && pathSegments[pageIndex + 1]) ? pathSegments[pageIndex + 1] : null;

    // Determine the primary lookup key and alternative fallback key
    let primaryKey = null;
    let fallbackKey = null;

    if (pageNumber && utmCampaign) {
        // If both exist, look for the combined version first, and the page number second
        primaryKey = `${pageNumber}_${utmCampaign}`;
        fallbackKey = pageNumber;
    } else if (pageNumber) {
        // If no UTM parameter exists, just look for the page number
        primaryKey = pageNumber;
    }

    // If we don't even have a page number, let the template default show naturally
    if (!primaryKey) return;

    // Wait for the DOM to be fully ready before looking for elements
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        fetch(csvUrl)
            .then(response => response.text())
            .then(csvText => {
                // Try searching with the primary key first (e.g., "179409_summer26" or "190488")
                let imageUrl = getImageUrlFromCSV(csvText, primaryKey);
                
                // If not found and we have a fallback key (page number), try that next
                if (!imageUrl && fallbackKey) {
                    console.log(`Primary key [${primaryKey}] not found. Trying fallback [${fallbackKey}]...`);
                    imageUrl = getImageUrlFromCSV(csvText, fallbackKey);
                }

                if (imageUrl) {
                    executeFastTransition(imageUrl);
                } else {
                    console.log('No background match found in CSV for keys:', primaryKey, fallbackKey || '');
                    restoreDefaultBackground(); // Fallback if no keys exist in CSV
                }
            })
            .catch(err => {
                console.error('Background Switcher Fetch Error:', err);
                restoreDefaultBackground(); // Fallback if Network fails
            });
    }

    function getImageUrlFromCSV(data, targetId) {
        const rows = data.split(/\r?\n/).filter(line => line.trim() !== "");
        for (let i = 1; i < rows.length; i++) {
            const currentRow = rows[i];
            const lastCommaIndex = currentRow.lastIndexOf(',');
            if (lastCommaIndex === -1) continue;

            let imgUrl = currentRow.substring(0, lastCommaIndex);
            let cid = currentRow.substring(lastCommaIndex + 1);

            imgUrl = imgUrl.replace(/['"\t]+/g, '').trim();
            cid = cid.replace(/['"\t]+/g, '').trim();

            if (cid.toLowerCase() === targetId.toLowerCase()) {
                return imgUrl;
            }
        }
        return null;
    }

    function executeFastTransition(newImageUrl) {
        const originalBg = document.querySelector('.background-image');
        
        if (!originalBg) {
            applyToBodyFallback(newImageUrl);
            return;
        }

        const cloneBg = document.createElement('div');
        cloneBg.className = 'utm-bg-overlay';
        
        cloneBg.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 40% !important;
            width: 70vw !important;
            height: 100vh !important;
            background-image: url('${newImageUrl}') !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            pointer-events: none !important;
            opacity: 0 !important;
            transition: opacity 0.4s ease-out !important;
        `;

        const originalZ = window.getComputedStyle(originalBg).zIndex;
        const baseZ = isNaN(parseInt(originalZ)) ? -1 : parseInt(originalZ);
        cloneBg.style.setProperty('z-index', (baseZ + 1).toString(), 'important');

        document.body.appendChild(cloneBg);

        // Preload the utm image entirely before showing it
        const img = new Image();
        img.src = newImageUrl;
        img.onload = function() {
            requestAnimationFrame(() => {
                cloneBg.style.setProperty('opacity', '1', 'important');
            });
        };
    }

    /**
     * Safely brings back the default template background if no match was found
     */
    function restoreDefaultBackground() {
        const originalBg = document.querySelector('.background-image');
        if (originalBg) {
            originalBg.style.setProperty('transition', 'opacity 0.4s ease-out', 'important'); 
            requestAnimationFrame(() => {
                originalBg.style.setProperty('opacity', '1', 'important');
            });
        }
    }

    function applyToBodyFallback(url) {
        const style = document.createElement('style');
        style.innerHTML = `
            .background-image { 
                background-image: url('${url}') !important;
                opacity: 1 !important; 
            }
        `;
        document.head.appendChild(style);
    }
})();