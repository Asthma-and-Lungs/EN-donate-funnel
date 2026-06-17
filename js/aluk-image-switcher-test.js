/**
 * ALUK Dynamic Background Switcher (Zero-Lag Hide/Show)
 * Updated to instantly hide default background to prevent flashes during loading
 * Hosted on GitHub
 */
(function() {
    const csvUrl = 'https://raw.githubusercontent.com/Asthma-and-Lungs/EN-donate-funnel/refs/heads/main/data/en_image_list_live.csv';
    
    // 1. Extract UTM Campaign
    const urlParams = new URLSearchParams(window.location.search);
    const utmCampaign = urlParams.get('utm_campaign');

    // 2. Extract Page Number from URL path
    const pathSegments = window.location.pathname.split('/');
    const pageIndex = pathSegments.indexOf('page');
    const pageNumber = (pageIndex !== -1 && pathSegments[pageIndex + 1]) ? pathSegments[pageIndex + 1] : null;

    // Determine the keys
    let primaryKey = null;
    let fallbackKey = null;

    if (pageNumber && utmCampaign) {
        primaryKey = `${pageNumber}_${utmCampaign}`;
        fallbackKey = pageNumber;
    } else if (pageNumber) {
        primaryKey = pageNumber;
    }

    // If we don't have a valid key, let the template behave normally
    if (!primaryKey) return;

    /**
     * CRITICAL ADDITION: Instantly hide the default background via injected CSS 
     * before the DOM even finishes fully rendering to prevent layout flashing.
     */
    const hideStyle = document.createElement('style');
    hideStyle.id = 'aluk-bg-hide-lock';
    hideStyle.innerHTML = `.background-image { opacity: 0 !important; }`;
    document.head.appendChild(hideStyle);

    // Wait for the DOM to be ready before creating elements
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        fetch(csvUrl)
            .then(response => response.text())
            .then(csvText => {
                let imageUrl = getImageUrlFromCSV(csvText, primaryKey);
                
                if (!imageUrl && fallbackKey) {
                    console.log(`Primary key [${primaryKey}] not found. Trying fallback [${fallbackKey}]...`);
                    imageUrl = getImageUrlFromCSV(csvText, fallbackKey);
                }

                if (imageUrl) {
                    executeFastTransition(imageUrl);
                } else {
                    console.log('No background match found in CSV:', primaryKey);
                    restoreDefaultBackground(); 
                }
            })
            .catch(err => {
                console.error('Background Switcher Fetch Error:', err);
                restoreDefaultBackground(); 
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
            removeHideLock();
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
            transition: opacity 0.2s ease-out !important;
        `;

        const originalZ = window.getComputedStyle(originalBg).zIndex;
        const baseZ = isNaN(parseInt(originalZ)) ? -1 : parseInt(originalZ);
        cloneBg.style.setProperty('z-index', (baseZ + 1).toString(), 'important');

        document.body.appendChild(cloneBg);

        // Preload the asset over the network entirely before rendering 
        const img = new Image();
        img.src = newImageUrl;
        img.onload = function() {
            requestAnimationFrame(() => {
                cloneBg.style.setProperty('opacity', '1', 'important');
                // Keep the default background hidden permanently since our new one is live
            });
        };
    }

    /**
     * Safely cleans up the loading block and fades back the original template asset
     */
    function restoreDefaultBackground() {
        removeHideLock();
        const originalBg = document.querySelector('.background-image');
        if (originalBg) {
            originalBg.style.setProperty('transition', 'opacity 0.2s ease-out', 'important'); 
            requestAnimationFrame(() => {
                originalBg.style.setProperty('opacity', '1', 'important');
            });
        }
    }

    /**
     * Removes the hard visibility override style block
     */
    function removeHideLock() {
        const lock = document.getElementById('aluk-bg-hide-lock');
        if (lock) lock.remove();
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