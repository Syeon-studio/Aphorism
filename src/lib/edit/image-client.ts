"use client";

import imageCompression from "browser-image-compression";

/**
 * 업로드 전 브라우저에서 사진 처리 (기획서 3-4).
 * - 허용: JPG·PNG·HEIC, 원본 20MB 이하
 * - 폰 사진 회전(EXIF) 보정
 * - 작품: 확대용(긴 변 1920px) + 썸네일(가로 600px), 대표 사진: 썸네일만
 * - WebP로 저장, 브라우저가 WebP를 못 만들면 JPEG
 */

export const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
export const ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png";

export type ProcessedImage = {
  full: File | null;
  thumb: File;
  width: number;
  height: number;
};

export class ImageError extends Error {}

function isHeic(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

let webpSupport: boolean | null = null;
function canEncodeWebp(): boolean {
  if (webpSupport === null) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    webpSupport = c.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return webpSupport;
}

async function dimensions(file: Blob): Promise<{ width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  const size = { width: bmp.width, height: bmp.height };
  bmp.close();
  return size;
}

/** HEIC → JPEG (Safari는 직접 읽을 수 있지만, 다른 브라우저를 위해 변환 라이브러리를 필요할 때만 불러온다) */
async function heicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  const blob = Array.isArray(out) ? out[0] : out;
  return new File([blob], file.name.replace(/\.hei[cf]$/i, ".jpg"), { type: "image/jpeg" });
}

async function resize(file: File, maxWidthOrHeight: number, fileType: string): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight,
    fileType,
    initialQuality: 0.85,
    maxSizeMB: 2.5, // 업로드 요청 한도(4.5MB) 안에 확대용+썸네일이 들어가도록
    useWebWorker: false, // 기본값은 외부 CDN에서 워커 스크립트를 받아온다 → 사용 안 함
    preserveExif: false, // 위치 정보 등 메타데이터 제거
  });
}

export async function processImage(file: File, kind: "work" | "profile"): Promise<ProcessedImage> {
  if (file.size > MAX_ORIGINAL_BYTES) throw new ImageError("사진 용량은 20MB 이하만 올릴 수 있습니다.");
  const okType = /image\/(jpeg|png)/i.test(file.type) || isHeic(file) || /\.(jpe?g|png)$/i.test(file.name);
  if (!okType) throw new ImageError("JPG, PNG, HEIC 사진만 올릴 수 있습니다.");

  let source = file;
  if (isHeic(file)) {
    try {
      source = await heicToJpeg(file);
    } catch {
      throw new ImageError("HEIC 사진을 읽지 못했습니다. JPG로 변환해서 다시 올려주세요.");
    }
  }

  const type = canEncodeWebp() ? "image/webp" : "image/jpeg";
  try {
    if (kind === "profile") {
      const { width, height } = await dimensions(source);
      const thumb = await resize(source, Math.round(600 * Math.max(1, height / width)), type);
      return { full: null, thumb, ...(await dimensions(thumb)) };
    }
    const full = await resize(source, 1920, type);
    const size = await dimensions(full);
    // 썸네일은 "가로 600px" 기준 → 세로가 긴 사진은 긴 변 값을 비율만큼 키운다
    const thumb = await resize(full, Math.round(600 * Math.max(1, size.height / size.width)), type);
    return { full, thumb, ...size };
  } catch (e) {
    if (e instanceof ImageError) throw e;
    throw new ImageError("사진을 처리하지 못했습니다. 다른 사진으로 시도해주세요.");
  }
}

/** 진행률 표시가 되는 업로드 (fetch는 업로드 진행률을 알 수 없어 XHR 사용) */
export function uploadWithProgress<T>(
  url: string,
  form: FormData,
  onProgress: (percent: number) => void,
): Promise<{ status: number; body: T }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.response as T });
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(form);
  });
}
