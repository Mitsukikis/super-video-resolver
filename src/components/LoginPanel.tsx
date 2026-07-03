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
          <p className="panel-kicker">可信入口</p>
          <strong>已登录</strong>
          <span className="muted">已开启临时 Cookie 解析和更高请求额度。</span>
        </div>
        <button className="button secondary" type="button" onClick={logout}>
          退出登录
        </button>
      </div>
    );
  }

  return (
    <div className="panel auth-panel stack">
      <div>
        <p className="panel-kicker">可信入口</p>
        <strong>访客模式</strong>
        <p className="muted">公开链接可直接解析。输入访问码后，可临时使用 Cookie 并获得更高额度。</p>
      </div>
      <div className="row auth-row">
        <input
          className="input"
          type="password"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="输入访问码"
          aria-label="访问码"
        />
        <button className="button" type="button" onClick={submitLogin} disabled={loading || !accessCode}>
          {loading ? "验证中..." : "登录"}
        </button>
      </div>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}
