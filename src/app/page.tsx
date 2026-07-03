import { CapabilityStrip } from "@/components/CapabilityStrip";
import { LoginPanel } from "@/components/LoginPanel";
import { ParticleField } from "@/components/ParticleField";
import { ResolverForm } from "@/components/ResolverForm";
import { isLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const loggedIn = await isLoggedIn();

  return (
    <>
      <ParticleField />
      <main className="app-shell">
        <section className="hero-console">
          <div className="hero-copy">
            <p className="eyebrow">服务器不代下载视频</p>
            <div className="title-lockup">
              <h1>超级视频解析</h1>
              <span aria-hidden="true">Resolver Console</span>
            </div>
            <p className="subcopy">
              粘贴支持的视频链接，解析高清轨道；能直下就让浏览器直连源站下载，音视频分离时可在本机浏览器合并，也可以复制本地工具命令。
              服务器只返回解析清单，不代理、不保存、不替用户下载视频文件。
            </p>
            <CapabilityStrip />
          </div>

          <div className="console-grid">
            <LoginPanel loggedIn={loggedIn} />
            <ResolverForm loggedIn={loggedIn} />
          </div>
        </section>
      </main>
    </>
  );
}
