"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminArtist } from "@/lib/admin/server";
import { formatDateTime, formatShort } from "@/lib/format";
import { fromKstLocalInput, SLUG_FORMAT, toKstLocalInput } from "@/lib/settings-validate";
import type { Settings } from "@/types/content";

type Notice = { kind: "ok" | "error"; text: string; details?: string[] } | null;

const input =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black focus:ring-2 focus:ring-black/10";
const smallBtn = "rounded-lg border border-black/15 px-2.5 py-1.5 text-sm hover:border-black/40 disabled:opacity-40";

export default function AdminDashboard({
  adminToken,
  siteUrl,
  artists,
  settings,
}: {
  adminToken: string;
  siteUrl: string;
  artists: AdminArtist[];
  settings: Settings;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const base = `/admin/${adminToken}`;

  async function call(body: Record<string, unknown>, okText: string): Promise<boolean> {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/${adminToken}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ kind: "error", text: data.error ?? "처리하지 못했습니다.", details: data.details });
        return false;
      }
      setNotice({ kind: "ok", text: okText });
      startTransition(() => router.refresh());
      return true;
    } catch {
      setNotice({ kind: "error", text: "처리하지 못했습니다. 인터넷 연결을 확인해주세요." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || pending;
  const unpublishedCount = artists.filter((a) => a.has_unpublished).length;
  const deadlinePassed = settings.edit_deadline ? new Date(settings.edit_deadline) <= new Date() : false;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-24 tablet:px-8">
      <header>
        <p className="text-sm opacity-60">{settings.exhibition_title}</p>
        <h1 className="mt-1 text-2xl font-bold">관리자</h1>
        <div className="mt-4 grid gap-2 text-sm tablet:grid-cols-3">
          <Stat label="작가" value={`${artists.length}명 (공개 ${artists.filter((a) => a.is_published).length})`} />
          <Stat label="미공개 변경 있음" value={`${unpublishedCount}명`} warn={unpublishedCount > 0} />
          <Stat
            label="수정 마감"
            value={settings.edit_deadline ? `${formatDateTime(settings.edit_deadline, false)}${deadlinePassed ? " (마감됨)" : ""}` : "설정 안 됨"}
            warn={!settings.edit_deadline}
          />
        </div>
      </header>

      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`sticky top-2 z-20 mt-6 rounded-lg p-3 text-sm shadow ${
            notice.kind === "error" ? "bg-[#fdecec] text-[#a01c1c]" : "bg-[#e6f4ea] text-[#1e6b34]"
          }`}
        >
          <div className="flex justify-between gap-2">
            <p className="font-bold">{notice.text}</p>
            <button type="button" onClick={() => setNotice(null)} aria-label="알림 닫기" className="opacity-60">
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

      <ArtistsSection
        artists={artists}
        base={base}
        siteUrl={siteUrl}
        disabled={disabled}
        call={call}
        setNotice={setNotice}
      />
      <AddArtist disabled={disabled} call={call} />
      <SettingsForm settings={settings} disabled={disabled} call={call} />
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${warn ? "bg-[#fff4d6]" : "bg-black/5"}`}>
      <p className="text-xs opacity-60">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ 작가 목록 */

type Call = (body: Record<string, unknown>, okText: string) => Promise<boolean>;

function ArtistsSection({
  artists,
  base,
  siteUrl,
  disabled,
  call,
  setNotice,
}: {
  artists: AdminArtist[];
  base: string;
  siteUrl: string;
  disabled: boolean;
  call: Call;
  setNotice: (n: Notice) => void;
}) {
  function move(i: number, d: -1 | 1) {
    const ids = artists.map((a) => a.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    call({ action: "artists.reorder", ids }, "메인 작가 목록 순서를 바꿨습니다.");
  }

  async function copyLink(a: AdminArtist) {
    const url = `${siteUrl}/edit/${a.edit_token}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice({ kind: "ok", text: `${a.name} 작가의 편집 링크를 복사했습니다. 작가 본인에게만 전달해주세요.` });
    } catch {
      window.prompt("편집 링크 (복사해서 작가에게 전달)", url);
    }
  }

  return (
    <section aria-labelledby="sec-artists" className="mt-10">
      <h2 id="sec-artists" className="text-lg font-bold">
        작가 <span className="text-sm font-normal opacity-60">메인 목록 순서</span>
      </h2>
      <p className="mt-1 text-sm opacity-60">
        편집 링크는 작가별 비밀 주소입니다. 링크를 아는 사람은 누구나 그 작가 페이지를 고칠 수 있으니 본인에게만 전달하세요.
      </p>
      <ul className="mt-4 grid gap-3">
        {artists.map((a, i) => (
          <li key={a.id} className="rounded-xl border border-black/15 bg-white p-3">
            <div className="flex items-start gap-2">
              <div className="flex shrink-0 flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={disabled || i === 0} aria-label={`${a.name} 위로`} className="h-7 w-8 rounded disabled:opacity-20">
                  ▲
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={disabled || i === artists.length - 1} aria-label={`${a.name} 아래로`} className="h-7 w-8 rounded disabled:opacity-20">
                  ▼
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{a.name}</span>
                  <StatusBadge a={a} />
                </p>
                <p className="mt-0.5 text-xs opacity-60">
                  /artists/{a.slug} · 작품 {a.work_count}점 · 마지막 수정 {formatShort(a.updated_at)}
                  {a.published_at && ` · 마지막 반영 ${formatShort(a.published_at)}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <a href={`${base}/artists/${a.id}`} className={`${smallBtn} bg-black font-bold text-white hover:border-black`}>
                    편집{a.has_unpublished ? "·공개" : ""}
                  </a>
                  <button type="button" onClick={() => copyLink(a)} className={smallBtn}>
                    편집 링크 복사
                  </button>
                  {a.is_published && (
                    <a href={`/artists/${a.slug}`} target="_blank" rel="noopener noreferrer" className={smallBtn}>
                      공개 페이지 ↗
                    </a>
                  )}
                  <details className="relative">
                    <summary className={`${smallBtn} cursor-pointer list-none`}>더보기 ▾</summary>
                    <div className="absolute z-10 mt-1 grid w-56 gap-1 rounded-lg border border-black/15 bg-white p-2 shadow-lg">
                      <MenuButton
                        disabled={disabled}
                        onClick={() => {
                          const slug = window.prompt(
                            `새 주소 (영문 소문자·숫자·하이픈)\n바꾸면 기존 /artists/${a.slug} 링크는 열리지 않습니다.`,
                            a.slug,
                          );
                          if (slug && slug !== a.slug) call({ action: "artist.slug", id: a.id, slug }, `주소를 /artists/${slug}로 바꿨습니다.`);
                        }}
                      >
                        주소(slug) 변경
                      </MenuButton>
                      <MenuButton
                        disabled={disabled}
                        onClick={() =>
                          window.confirm(`${a.name} 작가의 편집 링크를 새로 만들까요?\n기존 링크는 더 이상 열리지 않습니다.`) &&
                          call({ action: "artist.token", id: a.id }, "편집 링크를 새로 만들었습니다. 새 링크를 복사해 전달하세요.")
                        }
                      >
                        편집 링크 재발급
                      </MenuButton>
                      {a.has_backup && (
                        <MenuButton
                          disabled={disabled}
                          onClick={() =>
                            window.confirm(`${a.name} 작가의 공개 페이지를 직전 공개본으로 되돌릴까요?\n(한 번 더 누르면 다시 원래대로 돌아옵니다)`) &&
                            call({ action: "artist.restore", id: a.id }, "직전 공개본으로 되돌렸습니다.")
                          }
                        >
                          직전 공개본으로 복구
                        </MenuButton>
                      )}
                      {a.is_published && (
                        <MenuButton
                          disabled={disabled}
                          onClick={() =>
                            window.confirm(`${a.name} 작가를 공개 사이트에서 숨길까요?\n내용은 지워지지 않습니다.`) &&
                            call({ action: "artist.unpublish", id: a.id }, "공개를 중단했습니다.")
                          }
                        >
                          공개 중단(숨기기)
                        </MenuButton>
                      )}
                      <MenuButton
                        danger
                        disabled={disabled}
                        onClick={() => {
                          const typed = window.prompt(`작가와 사진이 모두 삭제되며 되돌릴 수 없습니다.\n삭제하려면 작가명 "${a.name}"을 입력하세요.`);
                          if (typed === a.name) call({ action: "artist.delete", id: a.id }, `${a.name} 작가를 삭제했습니다.`);
                        }}
                      >
                        작가 삭제
                      </MenuButton>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatusBadge({ a }: { a: AdminArtist }) {
  const [text, cls] = !a.is_published
    ? ["미공개", "bg-black/10"]
    : a.has_unpublished
      ? ["미공개 변경 있음", "bg-[#fff4d6] text-[#7a5b00]"]
      : ["공개됨", "bg-[#e6f4ea] text-[#1e6b34]"];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>{text}</span>;
}

function MenuButton({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded px-2 py-2 text-left text-sm hover:bg-black/5 disabled:opacity-40 ${danger ? "text-[#d33]" : ""}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ 작가 추가 */

function AddArtist({ disabled, call }: { disabled: boolean; call: Call }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const slugOk = SLUG_FORMAT.test(slug);
  return (
    <section aria-labelledby="sec-add" className="mt-10 rounded-xl border border-black/15 bg-white p-4">
      <h2 id="sec-add" className="font-bold">
        작가 추가
      </h2>
      <form
        className="mt-3 grid gap-3 tablet:grid-cols-[1fr_1fr_auto] tablet:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await call({ action: "artist.create", name, slug }, `${name} 작가를 추가했습니다. 편집 링크를 복사해 전달하세요.`)) {
            setName("");
            setSlug("");
          }
        }}
      >
        <label className="text-sm font-bold">
          작가명
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
        </label>
        <label className="text-sm font-bold">
          주소(slug)
          <input
            className={input}
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="kim-minae"
            maxLength={60}
            required
            aria-invalid={slug !== "" && !slugOk}
          />
        </label>
        <button type="submit" disabled={disabled || !name.trim() || !slugOk} className="rounded-lg bg-black px-4 py-2.5 font-bold text-white disabled:opacity-40">
          추가
        </button>
      </form>
      <p className="mt-2 text-xs opacity-60">추가한 작가는 작가가 내용을 입력하고 &quot;완료&quot;하기 전까지 공개 사이트에 보이지 않습니다.</p>
    </section>
  );
}

/* ------------------------------------------------------------------ 전시 설정 */

function SettingsForm({ settings, disabled, call }: { settings: Settings; disabled: boolean; call: Call }) {
  const [s, setS] = useState({
    ...settings,
    closed_text: settings.closed_dates.join(", "),
    opening_local: toKstLocalInput(settings.opening_at),
    deadline_local: toKstLocalInput(settings.edit_deadline),
  });
  const set = (patch: Partial<typeof s>) => setS((v) => ({ ...v, ...patch }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const { closed_text, opening_local, deadline_local, ...rest } = s;
    call(
      {
        action: "settings.save",
        settings: {
          ...rest,
          closed_dates: closed_text.split(/[,\s]+/).filter(Boolean),
          opening_at: fromKstLocalInput(opening_local),
          edit_deadline: fromKstLocalInput(deadline_local),
        },
      },
      "전시 설정을 저장했습니다. 공개 사이트에 바로 반영됩니다.",
    );
  }

  const field = (label: string, key: keyof typeof s, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="text-sm font-bold">
      {label}
      <input className={input} value={String(s[key] ?? "")} onChange={(e) => set({ [key]: e.target.value } as Partial<typeof s>)} {...props} />
    </label>
  );

  return (
    <section aria-labelledby="sec-settings" className="mt-10">
      <h2 id="sec-settings" className="text-lg font-bold">
        전시 설정
      </h2>
      <form onSubmit={submit} className="mt-4 grid gap-6 rounded-xl border border-black/15 bg-white p-4">
        <fieldset className="grid gap-3 rounded-lg bg-[#fff4d6]/60 p-3">
          <legend className="px-1 text-sm font-bold">작가 수정 마감 (한국 시간)</legend>
          {field("마감 일시", "deadline_local", { type: "datetime-local" })}
          <p className="text-xs opacity-70">
            비워두면 마감 없음. 마감 후 작가는 읽기 전용, 관리자는 계속 수정할 수 있습니다. 마감 시점에 &quot;미공개 변경 있음&quot;인 작가는 위 목록에서 확인 후 공개하세요.
          </p>
        </fieldset>

        <fieldset className="grid gap-3 tablet:grid-cols-2">
          <legend className="sr-only">전시 정보</legend>
          <div className="tablet:col-span-2">{field("전시명", "exhibition_title", { required: true, maxLength: 100 })}</div>
          {field("시작일", "period_start", { type: "date", required: true })}
          {field("종료일", "period_end", { type: "date", required: true })}
          {field("오프닝 일시", "opening_local", { type: "datetime-local" })}
          {field("휴관일 (YYYY-MM-DD, 쉼표로 구분)", "closed_text", { placeholder: "2026-12-25" })}
          <div className="tablet:col-span-2">{field("운영시간", "hours", { maxLength: 300 })}</div>
          {field("장소", "venue", { required: true, maxLength: 100 })}
          {field("주소", "address", { required: true, maxLength: 100 })}
          <div className="tablet:col-span-2">{field("지도 링크", "map_url", { type: "url", placeholder: "https://" })}</div>
          {field("입장료", "admission", { maxLength: 100 })}
          {field("문의 이메일", "contact_email", { type: "email" })}
          {field("인스타그램 아이디", "instagram", { placeholder: "aphorism (@ 없이)" })}
        </fieldset>

        <label className="text-sm font-bold">
          전시 서문
          <textarea className={`${input} leading-relaxed`} rows={8} value={s.intro_text} onChange={(e) => set({ intro_text: e.target.value })} maxLength={5000} />
        </label>

        <div className="text-right">
          <button type="submit" disabled={disabled} className="rounded-lg bg-black px-5 py-3 font-bold text-white disabled:opacity-40">
            설정 저장
          </button>
        </div>
      </form>
    </section>
  );
}
