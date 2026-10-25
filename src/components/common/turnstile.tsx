"use client";

import React, { useEffect, useRef, useState } from "react";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  resetSignal?: number;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: (errorCode?: string | number) => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export function TurnstileWidget({
  onVerify,
  onExpire,
  resetSignal,
  className = "",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const [hasError, setHasError] = useState(false);

  // Keep onVerify / onExpire in refs, updated in an effect on every render
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  });

  // Render effect depends ONLY on siteKey
  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let mounted = true;

    const renderWidget = () => {
      if (!mounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return; // Already rendered

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (mounted) {
              setHasError(false);
              onVerifyRef.current(token);
            }
          },
          "expired-callback": () => {
            if (mounted) {
              onExpireRef.current?.();
            }
          },
          "error-callback": (errorCode?: string | number) => {
            console.warn("[Turnstile Error]:", errorCode);
            if (mounted) {
              setHasError(true);
              onExpireRef.current?.();
            }
          },
          theme: "auto",
        });
      } catch (err) {
        console.warn("[Turnstile Render Error]:", err);
      }
    };

    // If script is already loaded
    if (window.turnstile) {
      renderWidget();
      return () => {
        mounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
          widgetIdRef.current = null;
        }
      };
    }

    // Load script dynamically
    const existingScript = document.getElementById("cloudflare-turnstile-script") as HTMLScriptElement | null;
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "cloudflare-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (mounted) renderWidget();
      };
      script.onerror = (e) => {
        console.warn("[Turnstile Script Load Error]:", e);
        if (mounted) {
          setHasError(true);
          onExpireRef.current?.();
        }
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", renderWidget);
    }

    return () => {
      mounted = false;
      if (existingScript) {
        existingScript.removeEventListener("load", renderWidget);
      }
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  // Reset signal effect: when resetSignal changes, call reset and onExpire
  const prevResetSignalRef = useRef(resetSignal);
  useEffect(() => {
    if (prevResetSignalRef.current !== resetSignal) {
      prevResetSignalRef.current = resetSignal;
      setHasError(false);
      if (window.turnstile) {
        try {
          if (widgetIdRef.current) {
            window.turnstile.reset(widgetIdRef.current);
          } else {
            window.turnstile.reset();
          }
        } catch (err) {
          console.warn("[Turnstile Reset Error]:", err);
        }
      }
      onExpireRef.current?.();
    }
  }, [resetSignal]);

  // If no site key configured in dev/test, render nothing
  if (!siteKey) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center my-3 ${className}`}>
      <div ref={containerRef} />
      {hasError && (
        <p className="text-xs text-red-500 mt-1.5 text-center" role="alert">
          Verification could not load. Disable ad blockers or try another browser.
        </p>
      )}
    </div>
  );
}
