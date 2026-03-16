import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router does not reset window scroll on navigation by default.
 * This component enforces scrolling to the top on pathname changes,
 * but skips scrolling when the URL contains a hash (anchor links),
 * so that ScrollToHash can handle those cases instead.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there's a hash, let ScrollToHash handle the scrolling.
    if (hash) return;
    // Use instant scroll to avoid visible flicker.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}


