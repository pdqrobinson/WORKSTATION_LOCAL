import React, { useEffect, useMemo, useState } from "react";

interface WebPanelProps {
  initialUrl?: string;
}

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "https://example.com";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const WebPanel: React.FC<WebPanelProps> = ({ initialUrl }) => {
  const [address, setAddress] = useState<string>(() => normalizeUrl(initialUrl ?? ""));
  const [currentUrl, setCurrentUrl] = useState<string>(() => normalizeUrl(initialUrl ?? ""));

  useEffect(() => {
    if (typeof initialUrl === "string" && initialUrl.trim()) {
      const next = normalizeUrl(initialUrl);
      setAddress(next);
      setCurrentUrl(next);
    }
  }, [initialUrl]);

  const displayUrl = useMemo(() => currentUrl, [currentUrl]);

  const handleNavigate = (event: React.FormEvent) => {
    event.preventDefault();
    const next = normalizeUrl(address);
    setAddress(next);
    setCurrentUrl(next);
  };

  return (
    <div className="web-panel">
      <form className="web-toolbar" onSubmit={handleNavigate}>
        <input
          className="web-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Enter URL"
        />
        <button className="web-go" type="submit">
          Go
        </button>
      </form>
      <div className="web-frame">
        <iframe
          src={displayUrl}
          title="Web Browser"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
