import { Map as MapIcon, Compass, Plus, User } from "lucide-react";

export type NavTab = "map" | "explore" | "create" | "profile";

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export default function BottomNav({ activeTab, onSelectTab }: Props) {
  return (
    <nav
      aria-label="Expedition Navigation"
      className="safe-b absolute inset-x-0 bottom-0 z-30 pointer-events-auto"
    >
      <div className="mx-auto max-w-md px-3 pb-2">
        <div className="glass rounded-3xl px-6 py-2 border border-emerald-950/70 shadow-[0_-8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="flex items-center justify-between relative">
            {/* Left group: Map & Explore */}
            <div className="flex-1 flex items-center justify-around pr-3">
              {/* Tab 1: Map */}
              <button
                onClick={() => onSelectTab("map")}
                className={`flex flex-col items-center gap-0.5 py-1 transition-all active:scale-95 ${
                  activeTab === "map" ? "text-emerald-400" : "text-white/50 hover:text-white/80"
                }`}
                aria-label="Map view"
              >
                <div className="relative">
                  <MapIcon size={21} strokeWidth={activeTab === "map" ? 2.5 : 2} />
                  {activeTab === "map" && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_#38b284]" />
                  )}
                </div>
                <span className="text-[10px] font-bold font-display tracking-wider">Map</span>
              </button>

              {/* Tab 2: Explore */}
              <button
                onClick={() => onSelectTab("explore")}
                className={`flex flex-col items-center gap-0.5 py-1 transition-all active:scale-95 ${
                  activeTab === "explore" ? "text-emerald-400" : "text-white/50 hover:text-white/80"
                }`}
                aria-label="Explore nearby discoveries"
              >
                <div className="relative">
                  <Compass size={21} strokeWidth={activeTab === "explore" ? 2.5 : 2} />
                  {activeTab === "explore" && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_#38b284]" />
                  )}
                </div>
                <span className="text-[10px] font-bold font-display tracking-wider">Explore</span>
              </button>
            </div>

            {/* Elevated Central Action Button (+) */}
            <div className="relative -top-4 flex items-center justify-center shrink-0">
              <button
                onClick={() => onSelectTab("create")}
                className="w-13 h-13 p-3.5 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-400 rounded-full shadow-lg shadow-emerald-950/80 border-4 border-[#071714] flex items-center justify-center text-white active:scale-95 hover:brightness-110 transition-transform"
                aria-label="Create Discovery"
                title="Create a new discovery"
              >
                <Plus size={24} strokeWidth={2.8} className="text-white drop-shadow" />
              </button>
            </div>

            {/* Right group: Profile */}
            <div className="flex-1 flex items-center justify-around pl-3">
              {/* Tab 3: Profile */}
              <button
                onClick={() => onSelectTab("profile")}
                className={`flex flex-col items-center gap-0.5 py-1 transition-all active:scale-95 ${
                  activeTab === "profile" ? "text-emerald-400" : "text-white/50 hover:text-white/80"
                }`}
                aria-label="Explorer profile"
              >
                <div className="relative">
                  <User size={21} strokeWidth={activeTab === "profile" ? 2.5 : 2} />
                  {activeTab === "profile" && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_#38b284]" />
                  )}
                </div>
                <span className="text-[10px] font-bold font-display tracking-wider">Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
