"use client";

import { useState } from "react";
import type { Manifest } from "@/lib/manifest";
import { ResultView } from "./ResultView";

type ResolverFormProps = {
  loggedIn: boolean;
};

type ResolveState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; manifest: Manifest };

export function ResolverForm({ loggedIn }: ResolverFormProps) {
  const [url, setUrl] = useState("");
  const [temporaryCookie, setTemporaryCookie] = useState("");
  const [state, setState] = useState<ResolveState>({ status: "idle" });

  async function resolve() {
    setState({ status: "loading" });
    const response = await fetch("/api/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url,
        temporaryCookie: loggedIn && temporaryCookie.trim() ? temporaryCookie : undefined
      })
    });
    const payload = await response.json();
    if (!payload.ok) {
      setState({ status: "error", message: payload.error ?? "解析失败" });
      return;
    }
    setState({ status: "success", manifest: payload.manifest });
  }

  return (
    <div className="resolver-stack">
      <section className="panel resolver-panel stack">
        <div className="panel-heading">
          <p className="panel-kicker">解析控制台</p>
          <h2>输入视频链接</h2>
          <p className="muted">服务器只返回解析清单，视频流量留在用户自己的设备上。</p>
        </div>

        <div className="field">
          <label htmlFor="video-url">视频链接</label>
          <div className="command-input">
            <input
              id="video-url"
              className="input"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://x.com/... 或 https://www.bilibili.com/video/..."
            />
            <button className="button primary-action" type="button" onClick={resolve} disabled={!url || state.status === "loading"}>
              {state.status === "loading" ? "解析中..." : "开始解析"}
            </button>
          </div>
        </div>

        {loggedIn ? (
          <div className="field">
            <label htmlFor="temporary-cookie">平台 Cookie（可选）</label>
            <textarea
              id="temporary-cookie"
              className="textarea"
              value={temporaryCookie}
              onChange={(event) => setTemporaryCookie(event.target.value)}
              placeholder="可粘贴 Cookie 请求头：auth_token=...; ct0=...，也支持 cookies.txt / Netscape 导出内容。"
            />
            <p className="muted">这里填的是 X / YouTube / B站账号 Cookie，不是本站访问码。内容只用于本次解析请求，不会保存。</p>
          </div>
        ) : (
          <p className="muted">如果视频需要账号态，请先用本站访问码解锁，再粘贴对应平台 Cookie 后重试。</p>
        )}

        {state.status === "error" ? <p className="error">{state.message}</p> : null}
      </section>

      {state.status === "success" ? <ResultView manifest={state.manifest} /> : null}
    </div>
  );
}
