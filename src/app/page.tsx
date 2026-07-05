import { PlatformCapabilitySections, PrivacyAndHowItWorks } from "@/components/PlatformCapabilitySections";
import { TopNav } from "@/components/TopNav";
import { UniversalResolverWorkspace } from "@/components/UniversalResolverWorkspace";
import { isLoggedIn } from "@/lib/auth";
import { getLivePlatforms, getPlannedPlatforms } from "@/lib/platformCapabilities";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const loggedIn = await isLoggedIn();
  const livePlatforms = getLivePlatforms();
  const plannedPlatforms = getPlannedPlatforms();

  return (
    <main className="app-shell">
      <TopNav loggedIn={loggedIn} platforms={livePlatforms} />
      <UniversalResolverWorkspace
        loggedIn={loggedIn}
        livePlatforms={livePlatforms}
        plannedPlatforms={plannedPlatforms}
      />
      <PlatformCapabilitySections livePlatforms={livePlatforms} plannedPlatforms={plannedPlatforms} />
      <PrivacyAndHowItWorks />
    </main>
  );
}
