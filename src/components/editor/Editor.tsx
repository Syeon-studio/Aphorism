"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LIMITS, stableStringify, toEducation, toExhibitions, validateContent } from "@/lib/content";
import { ImageError, processImage, uploadWithProgress } from "@/lib/edit/image-client";
import { formatDateTime, formatShort } from "@/lib/format";
import type { ArtistContent, Work } from "@/types/content";
import { TextArea, TextField } from "./fields";
import ImagePicker, { type UploadState } from "./ImagePicker";
import { EducationRows, EMPTY_EDUCATION, EMPTY_EXHIBITION, ExhibitionRows, padRows } from "./RowsEditor";
import WorkCard from "./WorkCard";

export type EditorProps = {
  /** 저장·업로드 API 접두사: 작가 "/api/edit/{token}", 관리자 "/api/admin/{admin}/artists/{id}" */
  apiBase: string;
  previewUrl: string;
  /** 관리자 편집: 마감과 무관, 상단에 관리자 표시와 돌아가기 링크 */
  admin?: { backHref: string };
  artistId: string;
  slug: string;
  /** Storage 공개 URL 접두사 ("…/storage/v1/object/public/images/") */
  imageBase: string;
  initialContent: ArtistContent;
  initialUpdatedAt: string;
  publishedAt: string | null;
  hasPublished: boolean;
  hasUnpublished: boolean;
  deadline: string | null;
  closed: boolean;
};

type Notice = { kind: "ok" | "error"; text: string; details?: string[] } | null;

const CLOSED_MESSAGE = "수정 기간이 종료되었습니다. 변경이 필요하면 관리자에게 연락해주세요.";

/** 빈 입력 줄을 채운 편집용 상태 (학력 3줄·전시 경력 10줄) */
function withBlankRows(c: ArtistContent): ArtistContent {
  return {
    ...c,
    education: padRows(c.education, 3, EMPTY_EDUCATION),
    exhibitions: padRows(c.exhibitions, 10, EMPTY_EXHIBITION),
  };
}

/** 변경 여부 비교용: 빈 줄은 무시 */
function compareKey(c: ArtistContent): string {
  return stableStringify({ ...c, education: toEducation(c.education), exhibitions: toExhibitions(c.exhibitions) });
}

function newWorkId() {
  return "w" + crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

export default function Editor(props: EditorProps) {
  const [content, setContent] = useState<ArtistContent>(() => withBlankRows(props.initialContent));
  const [savedKey, setSavedKey] = useState(() => compareKey(props.initialContent));
  const [baseUpdatedAt, setBaseUpdatedAt] = useState(props.initialUpdatedAt);
  const [status, setStatus] = useState({
    publishedAt: props.publishedAt,
    hasPublished: props.hasPublished,
    hasUnpublished: props.hasUnpublished,
  });
  const [closed, setClosed] = useState(props.closed);
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [busy, setBusy] = useState<null | "draft" | "publish">(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());

  const dirty = useMemo(() => compareKey(content) !== savedKey, [content, savedKey]);
  const uploading = Object.values(uploads).some(Boolean);
  const locked = closed;

  // 저장하지 않은 변경사항이 있는 채로 나가면 경고 (기획서 3-5)
  useEffect(() => {
    if (!dirty && !uploading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "저장하지 않은 변경사항이 있어요";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, uploading]);

  const src = useCallback(
    (path: string) => (!path ? "" : path.startsWith("/") || /^https?:\/\//.test(path) ? path : props.imageBase + path),
    [props.imageBase],
  );

  const set = (patch: Partial<ArtistContent>) => setContent((c) => ({ ...c, ...patch }));
  const setWork = (id: string, patch: Partial<Work>) =>
    setContent((c) => ({ ...c, works: c.works.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));

  /* -------------------------------------------------------------- 사진 */

  async function handleImage(key: string, file: File, kind: "work" | "profile") {
    setNotice(null);
    setUploads((u) => ({ ...u, [key]: { phase: "processing" } }));
    try {
      const img = await processImage(file, kind);
      const form = new FormData();
      form.append("kind", kind);
      if (kind === "work") {
        form.append("id", key);
        if (img.full) form.append("full", img.full, img.full.name || "full");
      }
      form.append("thumb", img.thumb, img.thumb.name || "thumb");
      setUploads((u) => ({ ...u, [key]: { phase: "uploading", percent: 0 } }));
      const res = await uploadWithProgress<{ error?: string; image?: string; image_full?: string; image_thumb?: string }>(
        `${props.apiBase}/upload`,
        form,
        (percent) => setUploads((u) => ({ ...u, [key]: { phase: "uploading", percent } })),
      );
      if (res.status === 423) setClosed(true);
      if (res.status !== 200 || !res.body) throw new ImageError(res.body?.error ?? "업로드에 실패했습니다.");
      if (kind === "profile") set({ profile_image: res.body.image ?? "" });
      else
        setWork(key, {
          image_full: res.body.image_full ?? "",
          image_thumb: res.body.image_thumb ?? "",
          width: img.width,
          height: img.height,
        });
      setNotice({ kind: "ok", text: "사진을 올렸습니다. 임시저장 또는 완료를 눌러야 저장됩니다." });
    } catch (e) {
      setNotice({
        kind: "error",
        text: e instanceof ImageError ? e.message : "업로드에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.",
      });
    } finally {
      setUploads((u) => ({ ...u, [key]: null }));
    }
  }

  /* -------------------------------------------------------------- 작품 목록 */

  function addWork() {
    const id = newWorkId();
    setNewIds((s) => new Set(s).add(id));
    setContent((c) => ({
      ...c,
      works: [...c.works, { id, image_full: "", image_thumb: "", width: 0, height: 0, title: "" }],
    }));
    requestAnimationFrame(() => document.getElementById(`work-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function moveWork(index: number, delta: -1 | 1) {
    setContent((c) => {
      const to = index + delta;
      if (to < 0 || to >= c.works.length) return c;
      return { ...c, works: arrayMove(c.works, index, to) };
    });
  }

  function deleteWork(work: Work) {
    if (!window.confirm(`"${work.title || "제목 없음"}" 작품을 삭제할까요?\n임시저장 또는 완료를 눌러야 실제로 반영됩니다.`)) return;
    setContent((c) => ({ ...c, works: c.works.filter((w) => w.id !== work.id) }));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setContent((c) => {
      const from = c.works.findIndex((w) => w.id === active.id);
      const to = c.works.findIndex((w) => w.id === over.id);
      return from < 0 || to < 0 ? c : { ...c, works: arrayMove(c.works, from, to) };
    });
  }

  /* -------------------------------------------------------------- 저장 */

  async function save(action: "draft" | "publish"): Promise<boolean> {
    if (uploading) {
      setNotice({ kind: "error", text: "사진 업로드가 끝난 뒤 저장해주세요." });
      return false;
    }
    const checked = validateContent(content, { artistId: props.artistId, mode: action });
    if (!checked.ok) {
      setNotice({
        kind: "error",
        text: action === "publish" ? "완료하려면 아래 항목을 확인해주세요." : "입력 내용을 확인해주세요.",
        details: checked.errors,
      });
      return false;
    }
    if (action === "publish" && !window.confirm("공개 사이트에 바로 반영됩니다. 완료할까요?")) return false;

    setBusy(action);
    setNotice(null);
    try {
      const res = await fetch(`${props.apiBase}/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: checked.content, action, baseUpdatedAt }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 423) setClosed(true);
        setNotice({ kind: "error", text: body.error ?? "저장하지 못했습니다.", details: body.details });
        return false;
      }
      // 서버와 같은 정리된 내용(앞뒤 공백 제거 등)으로 맞춘다
      setContent(withBlankRows(checked.content));
      setSavedKey(compareKey(checked.content));
      setBaseUpdatedAt(body.updated_at);
      setStatus((s) => ({
        publishedAt: body.published_at,
        hasPublished: s.hasPublished || action === "publish",
        hasUnpublished: body.has_unpublished,
      }));
      setNotice({
        kind: "ok",
        text: action === "publish" ? "공개 사이트에 반영했습니다." : "임시저장했습니다. 공개 사이트에는 아직 반영되지 않았습니다.",
      });
      return true;
    } catch {
      setNotice({ kind: "error", text: "저장하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해주세요." });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function openPreview() {
    const url = props.previewUrl;
    if (!dirty) {
      window.open(url, "_blank", "noopener");
      return;
    }
    // 팝업 차단을 피하려고 창을 먼저 열고, 임시저장 후 주소를 넣는다
    const win = window.open("", "_blank");
    const ok = await save("draft");
    if (ok && win) win.location.href = url;
    else win?.close();
  }

  /* -------------------------------------------------------------- 화면 */

  const statusText = !status.hasPublished
    ? "아직 공개 전"
    : status.hasUnpublished
      ? "임시저장됨 (미공개 변경 있음)"
      : `공개됨 · 마지막 반영 ${formatShort(status.publishedAt)}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40 tablet:px-8">
      <header>
        {props.admin ? (
          <p className="text-sm">
            <a href={props.admin.backHref} className="underline underline-offset-4">
              ← 관리자 화면
            </a>
            <span className="ml-2 rounded bg-black px-1.5 py-0.5 text-xs font-bold text-white">관리자 편집</span>
          </p>
        ) : (
          <p className="text-sm opacity-60">Overload: 감정의 풍경 · 작가 페이지 편집</p>
        )}
        <h1 className="mt-1 text-2xl font-bold">{content.name || "작가"} 님의 페이지</h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-live="polite">
          <span
            className={`rounded-full px-2.5 py-1 font-bold ${
              status.hasPublished && !status.hasUnpublished ? "bg-[#e6f4ea] text-[#1e6b34]" : "bg-[#fff4d6] text-[#7a5b00]"
            }`}
          >
            {statusText}
          </span>
          {dirty && <span className="font-bold text-[#d33]">· 저장하지 않은 변경사항 있음</span>}
        </p>
        {status.hasPublished && (
          <p className="mt-2 text-sm">
            <a href={`/artists/${props.slug}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              공개 페이지 보기 ↗
            </a>
          </p>
        )}
      </header>

      {closed ? (
        <p role="alert" className="mt-6 rounded-xl bg-black p-4 text-sm font-bold text-white">
          {CLOSED_MESSAGE}
        </p>
      ) : (
        props.deadline && (
          <p className="mt-6 rounded-xl bg-black/5 p-4 text-sm">
            수정 마감: <strong>{formatDateTime(props.deadline, false)}</strong> (마감 후에는 수정할 수 없습니다)
          </p>
        )
      )}

      <section aria-labelledby="sec-info" className="mt-10">
        <h2 id="sec-info" className="text-lg font-bold">
          작가 정보
        </h2>
        <fieldset disabled={locked} className="mt-4 grid gap-5 tablet:grid-cols-[200px_1fr]">
          <legend className="sr-only">작가 정보</legend>
          <div className="max-w-[200px]">
            <p className="mb-1.5 text-sm font-bold">대표 사진</p>
            <ImagePicker
              src={src(content.profile_image)}
              alt="대표 사진"
              aspect="1 / 1"
              state={uploads.profile ?? null}
              disabled={locked}
              onSelect={(f) => handleImage("profile", f, "profile")}
              onRemove={() => set({ profile_image: "" })}
              label="대표 사진 올리기"
            />
            <p className="mt-1 text-xs opacity-60">메인 작가 목록에는 가운데를 기준으로 정사각형으로 잘려 보입니다.</p>
          </div>
          <div className="grid gap-5">
            <TextField label="작가명" required value={content.name} onChange={(v) => set({ name: v })} maxLength={LIMITS.name} />
            <TextArea label="소개글" value={content.bio} onChange={(v) => set({ bio: v })} maxLength={LIMITS.bio} rows={6} />
            <TextField
              label="웹사이트"
              type="url"
              value={content.website ?? ""}
              onChange={(v) => set({ website: v })}
              maxLength={LIMITS.website}
              placeholder="https://"
            />
          </div>
          <div className="grid gap-8 tablet:col-span-2">
            <EducationRows rows={content.education} onChange={(education) => set({ education })} disabled={locked} />
            <ExhibitionRows rows={content.exhibitions} onChange={(exhibitions) => set({ exhibitions })} disabled={locked} />
          </div>
        </fieldset>
      </section>

      <section aria-labelledby="sec-works" className="mt-12">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="sec-works" className="text-lg font-bold">
            출품작 <span className="text-sm font-normal opacity-60">{content.works.length}점</span>
          </h2>
        </div>
        <p className="mt-1 text-sm opacity-60">⠿를 끌거나 ▲▼를 눌러 순서를 바꿀 수 있습니다. 이 순서대로 공개됩니다.</p>

        <DndContext
          id="works-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{
            screenReaderInstructions: {
              draggable: "스페이스바로 들어 올리고, 화살표 키로 옮긴 뒤 스페이스바로 내려놓습니다. Esc로 취소합니다.",
            },
          }}
        >
          <SortableContext items={content.works.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 grid gap-3">
              {content.works.map((work, i) => (
                  <WorkCard
                    key={work.id}
                    work={work}
                    index={i}
                    total={content.works.length}
                    imageSrc={src(work.image_thumb)}
                    uploadState={uploads[work.id] ?? null}
                    disabled={locked}
                    defaultOpen={newIds.has(work.id) || !work.image_thumb || !work.title}
                    onChange={(patch) => setWork(work.id, patch)}
                    onImage={(f) => handleImage(work.id, f, "work")}
                    onRemoveImage={() => setWork(work.id, { image_full: "", image_thumb: "", width: 0, height: 0 })}
                    onMove={(d) => moveWork(i, d)}
                    onDelete={() => deleteWork(work)}
                  />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {!locked && content.works.length < LIMITS.works && (
          <button
            type="button"
            onClick={addWork}
            className="mt-4 w-full rounded-xl border-2 border-dashed border-black/20 py-4 font-bold hover:border-black/50"
          >
            + 작품 추가
          </button>
        )}
      </section>

      {/* 하단 고정 버튼 */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-3 tablet:px-8">
          {notice && (
            <div
              role={notice.kind === "error" ? "alert" : "status"}
              className={`mb-3 max-h-40 overflow-y-auto rounded-lg p-3 text-sm ${
                notice.kind === "error" ? "bg-[#fdecec] text-[#a01c1c]" : "bg-[#e6f4ea] text-[#1e6b34]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{notice.text}</p>
                <button type="button" onClick={() => setNotice(null)} aria-label="알림 닫기" className="-m-1 p-1 opacity-60">
                  ✕
                </button>
              </div>
              {notice.details && notice.details.length > 0 && (
                <ul className="mt-1 list-disc pl-5">
                  {notice.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openPreview}
              disabled={busy !== null || uploading || (locked && !status.hasPublished)}
              className="shrink-0 rounded-xl border border-black/20 px-3 py-3 text-sm font-bold disabled:opacity-40"
            >
              미리보기
            </button>
            <button
              type="button"
              onClick={() => save("draft")}
              disabled={locked || busy !== null || uploading}
              className="flex-1 rounded-xl border border-black px-3 py-3 font-bold disabled:opacity-40"
            >
              {busy === "draft" ? "저장 중…" : "임시저장"}
            </button>
            <button
              type="button"
              onClick={() => save("publish")}
              disabled={locked || busy !== null || uploading}
              className="flex-1 rounded-xl bg-black px-3 py-3 font-bold text-white disabled:opacity-40"
            >
              {busy === "publish" ? "반영 중…" : "완료"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
