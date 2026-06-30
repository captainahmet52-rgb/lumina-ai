import { Sparkles } from "lucide-react";

interface InspirationTile {
  title: string;
  tag: string;
  gradient: string;
}

/** Static "Community Inspiration" gallery (spec §3.2 bottom grid). */
const TILES: InspirationTile[] = [
  {
    title: "Floating perfume on glass",
    tag: "Cinematic",
    gradient: "from-violet-500 to-fuchsia-400",
  },
  {
    title: "Neon sneaker in the rain",
    tag: "Neon",
    gradient: "from-indigo-500 to-cyan-400",
  },
  {
    title: "Skincare on marble",
    tag: "Minimal",
    gradient: "from-rose-400 to-orange-300",
  },
  {
    title: "Coffee bag, morning light",
    tag: "Lifestyle",
    gradient: "from-amber-500 to-yellow-300",
  },
  {
    title: "Watch on velvet",
    tag: "Product Hero",
    gradient: "from-emerald-500 to-teal-300",
  },
  {
    title: "Headphones in studio",
    tag: "Cinematic",
    gradient: "from-purple-600 to-violet-400",
  },
];

export function CommunityInspiration() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Community Inspiration</h2>
          <p className="text-sm text-[var(--muted)]">
            Prompts trending across the Lumina community.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {TILES.map((tile) => (
          <div
            key={tile.title}
            className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-[var(--border)]"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} opacity-90 transition-transform duration-500 group-hover:scale-105`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            <Sparkles className="absolute right-2.5 top-2.5 size-4 text-white/70" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                {tile.tag}
              </span>
              <p className="mt-1.5 line-clamp-2 text-xs font-medium text-white">
                {tile.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
