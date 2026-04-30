"use client";

import { useEffect, useMemo, useState } from "react";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";
import { Camera, GripVertical, ImagePlus, LoaderCircle, Move, Star, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";
import { cropAndCompressImage, fileToDataUrl } from "@/lib/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const BUCKET_NAME = "profile-photos";
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const CROPPER_ASPECT = 4 / 5;
const SUPPORTED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SUPPORTED_PHOTO_LABEL = "PNG, JPG, JPEG, or WEBP";
const UNSUPPORTED_PHOTO_MESSAGE = `Unsupported file type. Please upload ${SUPPORTED_PHOTO_LABEL}.`;

type PendingPhoto = {
  fileName: string;
  src: string;
  size: number;
};

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "photo";
}

function extractStoragePath(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(url.slice(index + marker.length));
}

function createUniquePhotoObjectPath(userId: string, fileName: string) {
  return `${userId}/${Date.now()}-${globalThis.crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

type PhotoUrlFieldProps = {
  urls: string[];
  onChange: (urls: string[]) => void;
  onPrimaryChange?: (url: string | null) => void;
  limit?: number;
};

export function PhotoUrlField({
  urls,
  onChange,
  onPrimaryChange,
  limit = 6,
}: PhotoUrlFieldProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [cropQueue, setCropQueue] = useState<PendingPhoto[]>([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const trimmedUrls = urls.map((url) => url.trim()).filter(Boolean);
  const remainingSlots = Math.max(limit - trimmedUrls.length, 0);
  const currentCrop = cropQueue[cropIndex] ?? null;

  useEffect(() => {
    if (!currentCrop) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [currentCrop]);

  function updateUrls(next: string[]) {
    const normalized = next.map((url) => url.trim()).filter(Boolean).slice(0, limit);
    onChange(normalized);
    onPrimaryChange?.(normalized[0] ?? null);
  }

  function resetCropper() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setMediaSize(null);
  }

  function closeCropper() {
    setCropQueue([]);
    setCropIndex(0);
    resetCropper();
  }

  async function getUserId() {
    if (!supabase) {
      throw new Error("Photo uploads are unavailable until Supabase browser keys are loaded.");
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("Please sign in again before uploading photos.");
    }

    return user.id;
  }

  async function uploadPhotoFile(file: File, originalFileName: string) {
    if (!supabase) {
      throw new Error("Photo uploads are unavailable until Supabase browser keys are loaded.");
    }

    const userId = await getUserId();
    const objectPath = createUniquePhotoObjectPath(userId, file.name);
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(objectPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      metadata: {
        originalFileName,
      },
      upsert: false,
    });

    if (uploadError) {
      throw new Error("We could not upload that photo. Please try again.");
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(objectPath);
    return data.publicUrl;
  }

  function reorderUrls(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= trimmedUrls.length || toIndex >= trimmedUrls.length) {
      return;
    }

    const next = [...trimmedUrls];
    const [selected] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, selected);
    updateUrls(next);
  }

  async function removeAt(index: number) {
    const removedUrl = trimmedUrls[index];
    const next = trimmedUrls.filter((_, currentIndex) => currentIndex !== index);

    updateUrls(next);
    setMessage(null);

    if (!supabase) {
      return;
    }

    const objectPath = extractStoragePath(removedUrl);

    if (!objectPath) {
      return;
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([objectPath]);

    if (error) {
      setMessage("Photo removed from your profile, but we could not clean up the stored file automatically.");
    }
  }

  async function handleFileUpload(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    const files = Array.from(fileList).slice(0, remainingSlots);

    if (!files.length) {
      setMessage(`You already have the maximum of ${limit} photos.`);
      return;
    }

    const oversized = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);

    if (oversized) {
      setMessage(`${oversized.name} is too large. Keep each photo under 8 MB.`);
      return;
    }

    const invalidType = files.find((file) => !SUPPORTED_PHOTO_TYPES.has(file.type));

    if (invalidType) {
      setMessage(UNSUPPORTED_PHOTO_MESSAGE);
      return;
    }

    const pending = await Promise.all(
      files.map(async (file) => ({
        fileName: file.name,
        src: await fileToDataUrl(file),
        size: file.size,
      })),
    );

    setMessage(null);
    setCropQueue(pending);
    setCropIndex(0);
    resetCropper();
  }

  async function handleCropSave() {
    if (!currentCrop) {
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const croppedFile = await cropAndCompressImage({
        src: currentCrop.src,
        cropArea:
          croppedAreaPixels ??
          (mediaSize
            ? {
                x: 0,
                y: 0,
                width: mediaSize.naturalWidth,
                height: mediaSize.naturalHeight,
              }
            : null),
        fileName: currentCrop.fileName,
      });
      const publicUrl = await uploadPhotoFile(croppedFile, currentCrop.fileName);
      const nextUrls = [...trimmedUrls, publicUrl];
      updateUrls(nextUrls);

      if (cropIndex === cropQueue.length - 1) {
        closeCropper();
        setMessage(cropQueue.length === 1 ? "Photo uploaded and styled." : `${cropQueue.length} photos uploaded and styled.`);
      } else {
        setCropIndex((value) => value + 1);
        resetCropper();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not process that photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Photo gallery</p>
          <p className="mt-1 text-sm text-slate-500">
            Drop photos straight from your camera roll. We compress them, let you frame them, and make the first one your cover.
          </p>
        </div>
        <Badge tone="info">
          <Camera className="h-3.5 w-3.5" />
          {trimmedUrls.length}/{limit}
        </Badge>
      </div>

      <label
        className={cn(
          "group block cursor-pointer rounded-[28px] border border-dashed px-5 py-8 text-left transition",
          dragActive
            ? "border-primary/70 bg-pink-50/80 shadow-soft-md"
            : "border-slate-300 bg-[linear-gradient(135deg,rgba(254,242,242,0.7),rgba(255,255,255,0.98),rgba(239,246,255,0.92))] hover:border-primary/40 hover:bg-white",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void handleFileUpload(event.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleFileUpload(event.target.files);
            event.currentTarget.value = "";
          }}
        />
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-soft-md">
            {uploading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          </div>
          <div className="space-y-2">
            <p className="text-base font-semibold text-slate-900">Upload, crop, and go</p>
            <p className="mx-auto max-w-xl text-sm leading-6 text-slate-600">
              Tap to upload, or drag images here. Each photo gets a portrait crop pass so it lands looking intentional across the app.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-500">
            <span className="rounded-full bg-white px-3 py-1">Auto-compressed</span>
            <span className="rounded-full bg-white px-3 py-1">Portrait crop ready</span>
            <span className="rounded-full bg-white px-3 py-1">{SUPPORTED_PHOTO_LABEL}</span>
            <span className="rounded-full bg-white px-3 py-1">{remainingSlots} slots left</span>
          </div>
        </div>
      </label>

      {trimmedUrls.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 text-sm leading-6 text-slate-500">
          Start with one sharp face photo, then add a second or third image that shows atmosphere and style. The first card becomes your cover everywhere.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {trimmedUrls.map((url, index) => {
            const isPrimary = index === 0;

            return (
              <div
                key={`${index}-${url}`}
                draggable={trimmedUrls.length > 1}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) {
                    reorderUrls(dragIndex, index);
                  }
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={cn(
                  "overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft-md transition",
                  dragIndex === index && "scale-[0.98] opacity-70",
                )}
              >
                <div className="relative">
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => setPreviewUrl(url)}
                    aria-label={`Open profile photo ${index + 1}`}
                  >
                    <RemoteImage
                      src={url}
                      alt={`Profile photo ${index + 1}`}
                      width={720}
                      height={960}
                      className="h-72 w-full object-cover object-top"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </button>
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-4">
                    <Badge tone={isPrimary ? "primary" : "default"}>
                      {isPrimary ? <Star className="h-3.5 w-3.5" /> : <Move className="h-3.5 w-3.5" />}
                      {isPrimary ? "Lead photo" : `Photo ${index + 1}`}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {!isPrimary ? (
                        <Button type="button" variant="secondary" className="h-9 px-3" onClick={() => reorderUrls(index, 0)}>
                          Make first
                        </Button>
                      ) : null}
                      <span className="rounded-full border border-white/80 bg-white/90 p-2 text-slate-500 shadow-sm">
                        <GripVertical className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-4">
                  <p className="text-sm leading-6 text-slate-600">
                    {isPrimary
                      ? "This image leads your profile in cards, messages, and bids."
                      : "Drag this card to reorder, or promote it to the cover with one tap."}
                  </p>
                  <Button type="button" variant="ghost" className="h-9 px-3 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => void removeAt(index)}>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {message ? (
        <div
          className="fixed right-4 top-[calc(5rem+env(safe-area-inset-top))] z-50 max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-soft-lg"
          role="status"
        >
          {message}
        </div>
      ) : null}

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo preview"
          onClick={() => setPreviewUrl(null)}
        >
          <Card className="relative max-h-[92dvh] w-full max-w-4xl overflow-hidden border-white/10 bg-slate-950 p-2">
            <Button
              type="button"
              variant="secondary"
              className="absolute right-4 top-4 z-10 h-11 rounded-full px-3"
              onClick={() => setPreviewUrl(null)}
              aria-label="Close photo preview"
            >
              <X className="h-4 w-4" />
            </Button>
            <RemoteImage
              src={previewUrl}
              alt="Profile photo preview"
              width={1200}
              height={1600}
              className="max-h-[88dvh] w-full rounded-[24px] object-contain"
            />
          </Card>
        </div>
      ) : null}

      {currentCrop ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 px-3 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Crop profile photo"
        >
          <div className="flex min-h-full items-start justify-center sm:items-center">
            <Card className="w-full max-w-4xl overflow-hidden rounded-[32px] border-white/10 bg-slate-950 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.8)]">
              <div className="grid max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto lg:grid-cols-[1.15fr_0.85fr] sm:max-h-[calc(100dvh-3rem)]">
                <div className="relative min-h-[320px] bg-slate-900 sm:min-h-[420px]">
                <Cropper
                  image={currentCrop.src}
                  crop={crop}
                  zoom={zoom}
                  aspect={CROPPER_ASPECT}
                  cropShape="rect"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                  onMediaLoaded={(currentMediaSize) => setMediaSize(currentMediaSize)}
                />
              </div>
                <div className="space-y-5 p-5 sm:p-7">
                <div className="space-y-3">
                  <Badge tone="primary">
                    <Upload className="h-3.5 w-3.5" />
                    Photo {cropIndex + 1} of {cropQueue.length}
                  </Badge>
                  <div>
                    <h3 className="text-[28px] font-semibold tracking-[-0.04em] text-white">Frame it like a profile card</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Keep the face and shoulders comfortably in view. We compress after cropping so uploads stay quick without looking muddy.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                    <span>Zoom</span>
                    <span>{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="mt-4 w-full accent-pink-500"
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                  This file started at {(currentCrop.size / (1024 * 1024)).toFixed(1)} MB. HostBid will upload a lighter portrait-ready version for feed speed and mobile quality.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="button" variant="secondary" className="flex-1" onClick={closeCropper}>
                    Cancel
                  </Button>
                  <Button type="button" className="flex-1" onClick={() => void handleCropSave()} disabled={uploading}>
                    {uploading ? "Saving photo..." : cropIndex === cropQueue.length - 1 ? "Save photo" : "Save and next"}
                  </Button>
                </div>
              </div>
            </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
