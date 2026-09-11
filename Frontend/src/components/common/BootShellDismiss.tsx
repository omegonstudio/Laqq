import { useEffect } from "react";

/**
 * Quita el overlay estático `#boot-shell` de index.html cuando React ya montó.
 * Debe vivir en App (todas las rutas): antes solo se removía en MainLayout,
 * y /login + /backoffice quedaban tapados por el skeleton eterno.
 */
const BootShellDismiss = () => {
  useEffect(() => {
    let cancelled = false;
    let removeTimer = 0;

    const hide = () => {
      if (cancelled) return;
      const el = document.getElementById("boot-shell");
      if (!el) return;
      el.style.opacity = "0";
      el.style.transition = "opacity 120ms ease";
      removeTimer = window.setTimeout(() => {
        if (!cancelled) el.remove();
      }, 160);
    };

    const run = () => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(hide));
    };

    const timeout = window.setTimeout(run, 400);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        window.clearTimeout(timeout);
        run();
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearTimeout(removeTimer);
    };
  }, []);

  return null;
};

export default BootShellDismiss;
