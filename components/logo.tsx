import { Pickaxe } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo() {
  return (
    <a href="/" className="flex items-center gap-2.5 group">
      <div
        className={cn(
          "relative w-9 h-9 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br from-foreground via-foreground to-foreground/90",
          "transition-all duration-500 ease-out",
          "group-hover:-rotate-6 group-hover:scale-105",
          "overflow-hidden"
        )}
        style={{
          boxShadow:
            "0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Inner highlight for 3D effect */}
        <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Subtle glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <Pickaxe className="w-4.5 h-4.5 text-background relative z-10 transition-transform duration-300 group-hover:scale-110" />
      </div>

      <div className="flex flex-col">
        <span
          className="text-lg font-semibold tracking-tight leading-none transition-colors duration-300"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.02)" }}
        >
          Reminer
        </span>
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Market Intel
        </span>
      </div>
    </a>
  );
}
