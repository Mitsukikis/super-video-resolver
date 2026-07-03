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
      <div className="panel row">
        <strong>已登录</strong>
        <span className="muted">已开启临时 Cookie 解析和更高请求额度。</span>
        <button className="button secondary" type="button" onClick={logout}>
          退出登录
        </button>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <div>
        <strong>访客模式</strong>
        <p className="muted">公开链接可以直接解析，但额度较低。登录后可为单次解析临时使用 Cookie。</p>
      </div>
      <div className="row">
        <input
          className="input"
          style={{ maxWidth: 320 }}
          type="password"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="访问码"
        />
        <button className="button" type="button" onClick={submitLogin} disabled={loading || !accessCode}>
          {loading ? "验证中..." : "登录"}
        </button>
      </div>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}
