/* ================= Site-wide alerts (SweetAlert2, branded) =================
   Every success / warning / error / info message on the site goes through
   this wrapper so the look (colors, font, RTL, buttons) is identical
   everywhere instead of ad-hoc banners per page. Loaded after
   sweetalert2.all.min.js and before any page-specific inline script. */

const SiteAlert = (function(){
  if (typeof Swal === "undefined") return null;

  const base = Swal.mixin({
    color: "#1C2A22",
    background: "#FFFFFF",
    confirmButtonColor: "#C89B3C",
    buttonsStyling: true,
    reverseButtons: true, // RTL: confirm button ends up on the visual right
    confirmButtonText: "باشه",
    customClass: {
      popup: "site-swal-popup",
      title: "site-swal-title",
      htmlContainer: "site-swal-text",
      confirmButton: "site-swal-confirm",
      cancelButton: "site-swal-cancel"
    }
  });

  function success(title, text, opts){
    return base.fire(Object.assign({ icon: "success", title, text }, opts || {}));
  }
  function error(title, text, opts){
    return base.fire(Object.assign({ icon: "error", title, text }, opts || {}));
  }
  function warning(title, text, opts){
    return base.fire(Object.assign({ icon: "warning", title, text }, opts || {}));
  }
  function info(title, text, opts){
    return base.fire(Object.assign({ icon: "info", title, text }, opts || {}));
  }
  /* small, auto-dismissing corner notice — for lightweight confirmations
     (e.g. "email sent") that shouldn't block the flow */
  function toast(icon, title){
    return base.fire({
      icon, title,
      toast: true, position: "top",
      showConfirmButton: false,
      timer: 2600, timerProgressBar: true,
    });
  }
  function confirmAction(opts){
    return base.fire(Object.assign({
      icon: "warning", showCancelButton: true,
      confirmButtonText: "تأیید", cancelButtonText: "انصراف"
    }, opts || {}));
  }

  return { success, error, warning, info, toast, confirmAction, raw: base };
})();
