import type { PlatformCapability } from "@/lib/platformCapabilities";

type PlatformCapabilitySectionsProps = {
  livePlatforms: PlatformCapability[];
  plannedPlatforms: PlatformCapability[];
};

function cookieLabel(value: PlatformCapability["cookieRequirement"]) {
  if (value === "often") return "经常需要 Cookie";
  if (value === "sometimes") return "部分场景需要 Cookie";
  if (value === "optional") return "Cookie 可选";
  return "当前未接入";
}

function mergeLabel(value: PlatformCapability["browserMerge"]) {
  if (value === "mixed") return "部分资源可本地合并";
  if (value === "unlikely") return "多数情况建议本地工具";
  return "未提供合并能力";
}

function PlatformCard({ platform }: { platform: PlatformCapability }) {
  return (
    <article className={`platform-card support-${platform.status}`}>
      <div className="platform-card-head">
        <span className="platform-icon" aria-hidden="true">
          {platform.shortLabel.slice(0, 2)}
        </span>
        <div>
          <h3>{platform.label}</h3>
          <p>{platform.domains.join(" / ")}</p>
        </div>
      </div>
      <div className="platform-meta-row">
        <span>{platform.statusLabel}</span>
        <span>{cookieLabel(platform.cookieRequirement)}</span>
        <span>{mergeLabel(platform.browserMerge)}</span>
      </div>
      {platform.outputTypes.length ? (
        <div className="capability-tags">
          {platform.outputTypes.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
      <p className="platform-note">{platform.notes}</p>
    </article>
  );
}

export function PlatformCapabilitySections({ livePlatforms, plannedPlatforms }: PlatformCapabilitySectionsProps) {
  return (
    <section id="platforms" className="content-section">
      <div className="section-heading">
        <span className="section-kicker">Platform Capability</span>
        <h2>真实支持与计划接入分开展示</h2>
        <p>
          只有已经接入后端解析器的平台才会标记为可解析；抖音、小红书、微博目前只是待接入，不会伪装成已支持。
        </p>
      </div>

      <div className="platform-grid">
        {livePlatforms.map((platform) => (
          <PlatformCard key={platform.id} platform={platform} />
        ))}
      </div>

      <div className="planned-strip" aria-label="计划接入平台">
        <strong>计划接入</strong>
        {plannedPlatforms.map((platform) => (
          <span key={platform.id}>{platform.label}</span>
        ))}
      </div>
    </section>
  );
}

export function PrivacyAndHowItWorks() {
  return (
    <section id="privacy" className="content-section privacy-grid">
      <div className="section-heading">
        <span className="section-kicker">Privacy & Flow</span>
        <h2>服务器只返回资源清单</h2>
        <p>本站不代下载、不长期保存用户视频文件；下载流量留在用户浏览器或用户自己的本地工具里。</p>
      </div>

      <div className="process-list">
        <article>
          <span>01</span>
          <h3>服务器负责</h3>
          <p>接收视频链接和本次临时 Cookie，调用现有解析器，返回标题、封面、轨道和可用下载方案。</p>
        </article>
        <article>
          <span>02</span>
          <h3>浏览器负责</h3>
          <p>展示资源清单，打开源站直链下载；当音视频分离且 CORS 允许时，可在本机浏览器内尝试合并。</p>
        </article>
        <article>
          <span>03</span>
          <h3>Cookie 处理</h3>
          <p>平台 Cookie 只用于当前解析请求，前端提交后立即清空输入，不写入 localStorage，也不放进 URL。</p>
        </article>
        <article>
          <span>04</span>
          <h3>明确不支持</h3>
          <p>不绕过 DRM、付费墙、私密内容权限或平台访问限制；账号权限不足时需要用户自行处理。</p>
        </article>
      </div>
    </section>
  );
}
