"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type RemoteImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function RemoteImage({
  src,
  alt,
  width,
  height,
  className,
  sizes,
  priority = false,
}: RemoteImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[inherit] bg-slate-100 text-xs text-slate-500",
          className,
        )}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      unoptimized
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
