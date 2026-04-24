export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const OUTPUT_MAX_WIDTH = 1440;
const OUTPUT_MAX_HEIGHT = 1920;
const OUTPUT_QUALITY = 0.86;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the selected image."));
    image.src = src;
  });
}

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(blob);
  });
}

export async function fileToDataUrl(file: File) {
  return await blobToDataUrl(file);
}

export async function cropAndCompressImage({
  src,
  cropArea,
  fileName,
}: {
  src: string;
  cropArea?: CropArea | null;
  fileName: string;
}) {
  const image = await loadImage(src);
  const resolvedCropArea =
    cropArea ??
    ({
      x: 0,
      y: 0,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    } satisfies CropArea);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to prepare the image editor.");
  }

  const scale = Math.min(
    1,
    OUTPUT_MAX_WIDTH / resolvedCropArea.width,
    OUTPUT_MAX_HEIGHT / resolvedCropArea.height,
  );

  canvas.width = Math.max(1, Math.round(resolvedCropArea.width * scale));
  canvas.height = Math.max(1, Math.round(resolvedCropArea.height * scale));

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    resolvedCropArea.x,
    resolvedCropArea.y,
    resolvedCropArea.width,
    resolvedCropArea.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", OUTPUT_QUALITY);
  });

  if (!blob) {
    throw new Error("Unable to compress the selected image.");
  }

  const sanitizedBaseName = fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-") || "photo";
  return new File([blob], `${sanitizedBaseName}.jpg`, { type: "image/jpeg" });
}
