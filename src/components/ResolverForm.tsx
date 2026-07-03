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
      setState({ status: "error", message: payload.error ?? "Resolve failed" });
      return;
    }
    setState({ status: "success", manifest: payload.manifest });
  }

  return (
    <div className="stack">
      <section className="panel stack">
        <div className="field">
          <label htmlFor="video-url">Video link</label>
          <input
            id="video-url"
            className="input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://www.bilibili.com/video/..."
          />
        </div>

        {loggedIn ? (
          <div className="field">
            <label htmlFor="temporary-cookie">Temporary cookie</label>
            <textarea
              id="temporary-cookie"
              className="textarea"
              value={temporaryCookie}
              onChange={(event) => setTemporaryCookie(event.target.value)}
              placeholder="Optional. Used once for this resolve request, never stored."
            />
            <p className="muted">Cookie text is passed only to this resolver request and is never persisted.</p>
          </div>
        ) : (
          <p className="muted">Log in to enable temporary cookie parsing for HD or account-visible results.</p>
        )}

        <div className="row">
          <button className="button" type="button" onClick={resolve} disabled={!url || state.status === "loading"}>
            {state.status === "loading" ? "Resolving..." : "Resolve link"}
          </button>
          <span className="muted">Server returns a manifest only. Video traffic stays on the user's device.</span>
        </div>
        {state.status === "error" ? <p className="error">{state.message}</p> : null}
      </section>

      {state.status === "success" ? <ResultView manifest={state.manifest} /> : null}
    </div>
  );
}

