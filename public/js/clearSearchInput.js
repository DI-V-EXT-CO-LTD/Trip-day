function clearInput() {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete("query");
    urlParams.delete("s");
  
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  
    window.location.href = newUrl;
  }
