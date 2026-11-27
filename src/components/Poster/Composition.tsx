import { wavePaths, type WaveOptions } from "./waves";

/**
 * 포스터 한 구도. 화면 비율이 viewBox와 달라도 꽉 차도록 slice로 채우고,
 * 글자는 잘리지 않는 안전 영역(safe) 안에만 둔다.
 */
export type CompositionProps = {
  width: number;
  height: number;
  waves: Omit<WaveOptions, "width" | "height">;
  /** 글자 배치 */
  text: {
    x: number;
    titleY: number;
    titleSize: number;
    subtitleSize: number;
    infoY: number;
    infoSize: number;
    anchor: "start" | "middle";
  };
  className?: string;
};

const ACCENT_EVERY = 9;

export default function Composition({
  width,
  height,
  waves,
  text,
  className,
}: CompositionProps) {
  const paths = wavePaths({ width, height, ...waves });
  const t = text;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width={width} height={height} fill="var(--poster-bg)" />
      <g className="poster-drift" fill="none" strokeLinecap="round">
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke={i % ACCENT_EVERY === 4 ? "var(--poster-accent)" : "var(--poster-line)"}
            strokeWidth={i % ACCENT_EVERY === 4 ? 2.4 : 1.2}
            strokeOpacity={i % ACCENT_EVERY === 4 ? 0.95 : 0.55}
          />
        ))}
      </g>
      <g fill="var(--poster-fg)" textAnchor={t.anchor} style={{ fontFamily: "var(--font-sans)" }}>
        <text x={t.x} y={t.titleY} fontSize={t.titleSize} fontWeight={700} letterSpacing="-0.02em">
          Overload
        </text>
        <text x={t.x} y={t.titleY + t.subtitleSize * 1.6} fontSize={t.subtitleSize} fontWeight={700}>
          감정의 풍경
        </text>
        <text x={t.x} y={t.infoY} fontSize={t.infoSize}>
          2026. 12. 22 – 12. 31
        </text>
        <text x={t.x} y={t.infoY + t.infoSize * 1.5} fontSize={t.infoSize}>
          역삼1동복합문화센터 1층
        </text>
      </g>
    </svg>
  );
}
