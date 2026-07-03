"use client";

import { useState } from "react";

type LoginPanelProps = {
  loggedIn: boolean;
};

export function LoginPanel({ loggedIn }: LoginPanelProps) {
  const [accessCode, setAccessCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitLogin() {
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessCode })
    });
    const payload = await response.json();
    setLoading(false);
    if (!payload.ok) {
      setMessage(payload.error ?? "Login failed");
      return;
    }
    location.reload();
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    location.reload();
  }

  if (loggedIn) {
    return (
      <div className="panel row">
        <strong>Logged in</strong>
        <span className="muted">Temporary cookie parsing and higher quotas are enabled.</span>
        <button className="button secondary" type="button" onClick={logout}>
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <div>
        <strong>Guest mode</strong>
        <p className="muted">Public links work with a lower quota. Log in to use temporary cookies for one request.</p>
      </div>
      <div className="row">
        <input
          className="input"
          style={{ maxWidth: 320 }}
          type="password"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="Access code"
        />
        <button className="button" type="button" onClick={submitLogin} disabled={loading || !accessCode}>
          {loading ? "Checking..." : "Log in"}
        </button>
      </div>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}

