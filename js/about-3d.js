/*
 * مدل سه‌بعدی بخش «درباره ما»
 * ---------------------------------------------
 * برای اینکه سایت سنگین نشه، کتابخانه‌ی نمایش سه‌بعدی (model-viewer) و فایل
 * مدل (glb) اصلاً دانلود نمی‌شن مگر اینکه کاربر واقعاً به این بخش از صفحه
 * نزدیک بشه (با IntersectionObserver). یعنی روی موبایل ضعیف یا اینترنت کند
 * هم، بارگذاری اولیه‌ی سایت هیچ سنگین‌تر نمی‌شه.
 */
(function () {
  var mount = document.getElementById('about3dMount');
  if (!mount) return;

  var modelSrc = mount.getAttribute('data-model-src');
  var started = false;

  function startLoading() {
    if (started) return;
    started = true;

    import('../assets/vendor/model-viewer/model-viewer.min.js')
      .then(function (mod) {
        // مسیر دیکودر فشرده‌سازی meshopt (باعث می‌شه فایل مدل ~30 برابر کوچیک‌تر بشه)
        mod.ModelViewerElement.meshoptDecoderLocation =
          'assets/vendor/model-viewer/meshopt_decoder.js';

        var mv = document.createElement('model-viewer');
        mv.className = 'about-3d-model';
        mv.setAttribute('src', modelSrc);
        mv.setAttribute('alt', 'مدل سه‌بعدی سودیار');
        mv.setAttribute('auto-rotate', '');
        mv.setAttribute('rotation-per-second', '16deg');
        mv.setAttribute('camera-controls', '');
        mv.setAttribute('disable-zoom', '');
        mv.setAttribute('interaction-prompt', 'none');
        mv.setAttribute('camera-orbit', '-35deg 78deg auto');
        mv.setAttribute('min-camera-orbit', 'auto 60deg auto');
        mv.setAttribute('max-camera-orbit', 'auto 92deg auto');
        mv.setAttribute('field-of-view', '32deg');
        mv.setAttribute('shadow-intensity', '0.9');
        mv.setAttribute('shadow-softness', '1');
        mv.setAttribute('exposure', '1.1');
        mv.setAttribute('loading', 'eager');
        mv.setAttribute('reveal', 'auto');

        mv.addEventListener('load', function () {
          mount.classList.add('is-loaded');
        });

        mount.appendChild(mv);
      })
      .catch(function () {
        // اگر به هر دلیلی (مثلاً مرورگر خیلی قدیمی) نتونستیم مدل رو نشون بدیم،
        // اسکلت لودینگ رو مخفی می‌کنیم که فضای خالی عجیب نمونه
        mount.classList.add('is-failed');
      });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startLoading();
            io.disconnect();
          }
        });
      },
      { rootMargin: '700px 0px' }
    );
    io.observe(mount);
  } else {
    startLoading();
  }
})();
