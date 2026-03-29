import MatchFocusPanel from "@/components/live/MatchFocusPanel";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "./useMediaQuery";
import type { MatchLike } from "@/components/live/CompactMatchCard";

export function ResponsiveMatchPanel({
  match,
  title = "Detalhes do jogo",
  onClose,
}: {
  match: MatchLike | null;
  title?: string;
  onClose?: () => void;
}) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  if (desktop) {
    return <MatchFocusPanel match={match} />;
  }

  return (
    <Drawer open={!!match} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DrawerContent className="max-h-[88vh]">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-2 pb-4">
          <MatchFocusPanel match={match} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
