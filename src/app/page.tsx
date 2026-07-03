import { LoginPanel } from "@/components/LoginPanel";
import { ResolverForm } from "@/components/ResolverForm";
import { isLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const loggedIn = await isLoggedIn();

  return (
    <main className="app-shell">
      <section className="resolver-surface">
        <div>
          <p className="eyebrow">No server video proxy</p>
          <h1>Super Video Resolver</h1>
          <p className="subcopy">
            Parse supported video links, pick HD tracks, merge in your browser when possible, or copy local-tool commands.
            The server resolves metadata only and never downloads video files for users.
          </p>
        </div>
        <LoginPanel loggedIn={loggedIn} />
        <ResolverForm loggedIn={loggedIn} />
      </section>
    </main>
  );
}
