(function () {
  try {
    var stored = localStorage.getItem('tj-theme');
    var mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    var dark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    /* localStorage tidak tersedia: biarkan tema bawaan (terang) */
  }
})();
