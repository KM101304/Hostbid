import { RemoteImage } from "@/components/ui/remote-image";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  if (src) {
    return (
      <RemoteImage
        src={src}
        alt={alt}
        width={96}
        height={96}
        className={cn(
          "h-12 w-12 rounded-full border border-white/80 object-cover shadow-[0_10px_24px_-16px_rgba(15,23,42,0.45)]",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,rgba(249,168,212,0.3),rgba(226,232,240,0.9))] text-sm font-semibold text-slate-700 shadow-[0_10px_24px_-16px_rgba(15,23,42,0.35)]",
        className,
      )}
    >
      {fallback ?? alt.slice(0, 1).toUpperCase()}
    </div>
  );
}
