import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router does not reset window scroll on navigation by default.
 * This component enforces scrolling to the top on pathname changes.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use instant scroll to avoid visible flicker.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}


