(function storeUtmParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content', 'ea.tracking.id'];
  
  // Retrieve existing stored params or initialize empty object
  let storedUtms = JSON.parse(sessionStorage.getItem('utm_data') || '{}');
  let hasNewData = false;

  utmKeys.forEach(key => {
    if (urlParams.has(key)) {
      storedUtms[key] = urlParams.get(key);
      hasNewData = true;
    }
  });

  // Only update sessionStorage if new parameters are found
  if (hasNewData) {
    sessionStorage.setItem('utm_data', JSON.stringify(storedUtms));
  }
})();