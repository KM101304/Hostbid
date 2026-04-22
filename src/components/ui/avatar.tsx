import Image from "next/image";
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
      <Image
        src={src}
        alt={alt}
        width={96}
        height={96}
        className={cn("h-12 w-12 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid h-12 w-12 place-items-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700",
        className,
      )}
    >
      {fallback ?? alt.slice(0, 1).toUpperCase()}
    </div>
  );
}
