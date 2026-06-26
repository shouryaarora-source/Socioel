import { X } from "lucide-react";
import { EventMapView } from "@/components/EventMapView";
import { useListEvents } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

interface MapModalProps {
  onClose: () => void;
}

export function MapModal({ onClose }: MapModalProps) {
  const { data: events, isLoading } = useListEvents({ upcoming: true });

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b bg-background/95 backdrop-blur-lg shrink-0">
        <span className="font-display font-bold text-lg">Events on the Map</span>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Close map"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <EventMapView
            events={events ?? []}
            userCoords={null}
            fullHeight
          />
        )}
      </div>
    </div>
  );
}
