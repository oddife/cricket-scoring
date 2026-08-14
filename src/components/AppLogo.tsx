"use client";

import { useEffect, useState } from "react";

type AppLogoProps = {
  alt?: string;
  className?: string;
  onClick?: () => void;
};

const APP_LOGO_EVENT = "cricket-scorer-app-logo-updated";

export function notifyAppLogoUpdated() {
  window.dispatchEvent(new Event(APP_LOGO_EVENT));
}

export default function AppLogo({
  alt = "New Castle Cricket Scorer",
  className = "h-full w-full object-contain",
  onClick,
}: AppLogoProps) {
  const [version, setVersion] = useState(0);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const refresh = () => {
      setAvailable(true);
      setVersion((current) => current + 1);
    };

    window.addEventListener(APP_LOGO_EVENT, refresh);
    return () => window.removeEventListener(APP_LOGO_EVENT, refresh);
  }, []);

  const image = available ? (
    <img
      src={`/api/settings/logo?v=${version}`}
      alt={alt}
      className={className}
      onError={() => setAvailable(false)}
    />
  ) : (
    <span className="select-none text-xl" aria-hidden="true">
      🏏
    </span>
  );

  if (!onClick) return image;

  return (
    <button type="button" onClick={onClick} aria-label={alt}>
      {image}
    </button>
  );
}
