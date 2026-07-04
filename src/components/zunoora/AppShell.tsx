import { Sidebar } from "./Sidebar";
import { MainStage } from "./MainStage";

export function AppShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--carbon)] text-foreground">
      <Sidebar />
      <MainStage />
    </div>
  );
}
