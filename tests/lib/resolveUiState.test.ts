import { describe, expect, it } from "vitest";
import { classifyResolveError, redactCookieForDisplay } from "@/lib/client/resolveUiState";

describe("classifyResolveError", () => {
  it("maps backend error strings to actionable UI categories", () => {
    expect(classifyResolveError("请输入视频链接")).toMatchObject({ kind: "empty-url", retry: false });
    expect(classifyResolveError("暂不支持该平台")).toMatchObject({ kind: "unsupported-platform", retry: false });
    expect(classifyResolveError("使用临时 Cookie 解析需要先登录")).toMatchObject({ kind: "cookie-missing", retry: true });
    expect(classifyResolveError("请求过于频繁，请稍后再试")).toMatchObject({ kind: "rate-limited", retry: true });
    expect(classifyResolveError("解析超时")).toMatchObject({ kind: "timeout", retry: true });
    expect(classifyResolveError("X/Twitter 没在这条帖子里找到可下载视频")).toMatchObject({
      kind: "no-downloadable-resource"
    });
    expect(classifyResolveError("该平台需要账号态。请先输入本站访问码")).toMatchObject({ kind: "login-required" });
    expect(classifyResolveError("该链接似乎涉及私密、付费或 DRM 受限内容")).toMatchObject({
      kind: "protected-content"
    });
    expect(classifyResolveError("fetch failed")).toMatchObject({ kind: "network", retry: true });
    expect(classifyResolveError("RESOLVER_DEPENDENCY_MISSING: 服务器尚未安装视频解析组件")).toMatchObject({
      kind: "server-config",
      retry: false
    });
    expect(classifyResolveError("Bilibili 源站请求策略拦截（HTTP 412），可能需要平台 Cookie。")).toMatchObject({
      kind: "source-blocked",
      retry: true
    });
    expect(classifyResolveError("Bilibili Cookie 可能已失效，请重新导出后再试。")).toMatchObject({
      kind: "cookie-invalid",
      retry: true
    });
  });

  it("never returns the full cookie for display", () => {
    expect(redactCookieForDisplay("auth_token=abc123; ct0=def456")).toBe("auth_token=***; ct0=***");
    expect(redactCookieForDisplay("# Netscape HTTP Cookie File\n.x.com\tTRUE\t/\tTRUE\t1\tauth_token\tabc")).toContain(
      "[cookies.txt]"
    );
  });
});
