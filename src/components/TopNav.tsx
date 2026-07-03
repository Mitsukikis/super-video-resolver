import type { PlatformCapability } from "@/lib/platformCapabilities";

type TopNavProps = {
  loggedIn: boolean;
  platforms: PlatformCapability[];
};

export function TopNav({ loggedIn, platforms }: TopNavProps) {
  return (
    <header className="top-nav">
      <a className="brand-mark" href="#resolver" aria-label="回到解析工作台">
        <span className="brand-orbit" aria-hidden="true">SV</span>
        <span>
          <strong>超级视频解析</strong>
          <small>Universal Resolver</small>
        </span>
      </a>

      <nav className="nav-links" aria-label="页面导航">
        <a href="#platforms">支持平台</a>
        <a href="#privacy">隐私说明</a>
        <a href="#tasks">任务中心</a>
      </nav>

      <div className="nav-status" aria-label="当前授权状态">
        <span className={loggedIn ? "status-dot is-ok" : "status-dot"} />
        <span>{loggedIn ? "已授权 Cookie 输入" : "访客模式"}</span>
        <span className="nav-divider" aria-hidden="true" />
        <span>{platforms.length} 个真实接入平台</span>
      </div>
    </header>
  );
}
