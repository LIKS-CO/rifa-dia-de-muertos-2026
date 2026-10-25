/**
 * Client-side image compression for proof-of-payment uploads.
 * Keeps uploads small (and under the server action body limit).
 */
export async function fileToCompressedJpeg(
  file: File,
  maxDim = 1200,
  quality = 0.78,
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("No se pudo comprimir la imagen");

  const name = file.name.replace(/\.[^.]+$/, "") || "comprobante";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
}

export function dataUrlToFile(dataUrl: string, filename = "imagen"): File {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}