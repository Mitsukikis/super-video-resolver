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
      setMessage(payload.error ?? "登录失败");
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
      <div className="panel auth-panel row">
        <div>
          <p className="panel-kicker">站内授权</p>
          <strong>已解锁 Cookie 输入</strong>
          <span className="muted">访问码只解锁本站功能，不会自动登录 X / YouTube / B站。</span>
        </div>
        <button className="button secondary" type="button" onClick={logout}>
          退出授权
        </button>
      </div>
    );
  }

  return (
    <div className="panel auth-panel stack">
      <div>
        <p className="panel-kicker">站内授权</p>
        <strong>访客模式</strong>
        <p className="muted">公开链接可直接解析。输入访问码后，只是解锁临时 Cookie 输入框，不代表已经登录视频平台账号。</p>
      </div>
      <div className="row auth-row">
        <input
          className="input"
          type="password"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="输入本站访问码"
          aria-label="本站访问码"
        />
        <button className="button" type="button" onClick={submitLogin} disabled={loading || !accessCode}>
          {loading ? "验证中..." : "解锁"}
        </button>
      </div>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}
