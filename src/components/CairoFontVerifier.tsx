"use client";

import { useEffect } from "react";

const FONT_STACK = 'var(--font-cairo), "Cairo", Arial, Helvetica, sans-serif';

export default function CairoFontVerifier() {
  useEffect(() => {
    let cancelled = false;

    const enforceFontFamily = () => {
      document.documentElement.style.setProperty("font-family", FONT_STACK, "important");
      document.body.style.setProperty("font-family", FONT_STACK, "important");
    };

    const verifyFont = () => {
      const probe = document.createElement("span");
      probe.textContent = "Cairo Font Probe";
      probe.style.position = "fixed";
      probe.style.opacity = "0";
      probe.style.pointerEvents = "none";
      probe.style.fontFamily = "inherit";

      document.body.appendChild(probe);
      const computedFont = getComputedStyle(probe).fontFamily;
      document.body.removeChild(probe);

      const hasCairo = /cairo/i.test(computedFont);
      document.documentElement.dataset.fontCairo = hasCairo ? "loaded" : "fallback";

      if (!hasCairo) {
        console.warn('Cairo font is not applied globally. Computed stack:', computedFont);
      }
    };

    const run = async () => {
      enforceFontFamily();

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      if (!cancelled) {
        enforceFontFamily();
        verifyFont();
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
