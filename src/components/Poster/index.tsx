import Composition from "./Composition";

/**
 * 메인 첫 화면 포스터 (임시 디자인, 5단계에서 최종 시안으로 교체).
 * 구도 3가지를 브레이크포인트마다 전환한다:
 *   모바일 <768 세로 9:16 / 태블릿 768–1199 4:5 / 데스크톱 ≥1200 가로 16:9
 * 디자인만 바꿀 때는 이 폴더 안만 수정하면 된다.
 * 안전 영역(글자 배치 가능 범위)은 각 구도 주석 참고.
 */
/** 포스터에 그려진 글자와 같은 내용 (포스터 디자인을 바꾸면 함께 수정) */
const POSTER_LABEL =
  "Overload: 감정의 풍경 전시 포스터. 2026년 12월 22일부터 12월 31일까지, 역삼1동복합문화센터 1층";

export default function Poster() {
  return (
    <section className="poster relative h-svh w-full overflow-hidden">
      {/* role="img" 안의 요소는 보조기기에 숨겨지므로 스크롤 링크는 바깥에 둔다 */}
      <div
        role="img"
        aria-label={POSTER_LABEL}
        className="absolute inset-0"
      >
      {/* 모바일 900×1600 — 안전 영역 x 150–750, y 220–1380 */}
      <Composition
        className="absolute inset-0 block h-full w-full tablet:hidden"
        width={900}
        height={1600}
        waves={{ count: 46, amplitude: 0.09, frequency: 2.2, vertical: true }}
        text={{
          x: 170, titleY: 420, titleSize: 132, subtitleSize: 64,
          infoY: 1260, infoSize: 38, anchor: "start",
        }}
      />
      {/* 태블릿 1000×1250 — 안전 영역 x 150–850, y 300–950 */}
      <Composition
        className="absolute inset-0 hidden h-full w-full tablet:block desktop:hidden"
        width={1000}
        height={1250}
        waves={{ count: 52, amplitude: 0.11, frequency: 2.4 }}
        text={{
          x: 500, titleY: 470, titleSize: 150, subtitleSize: 66,
          infoY: 860, infoSize: 34, anchor: "middle",
        }}
      />
      {/* 데스크톱 1600×900 — 안전 영역 x 300–1300, y 150–750 */}
      <Composition
        className="absolute inset-0 hidden h-full w-full desktop:block"
        width={1600}
        height={900}
        waves={{ count: 58, amplitude: 0.14, frequency: 3 }}
        text={{
          x: 320, titleY: 330, titleSize: 170, subtitleSize: 72,
          infoY: 650, infoSize: 34, anchor: "start",
        }}
      />
      </div>

      <a
        href="#intro"
        aria-label="아래로 스크롤"
        className="poster-scroll absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 p-3 text-2xl text-[var(--poster-fg)]"
      >
        ↓
      </a>
    </section>
  );
}
