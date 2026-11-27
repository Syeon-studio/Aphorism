/**
 * 임시 포스터 그래픽: 가운데로 갈수록 진폭이 커지는(과부하되는) 물결선.
 * 결정적(seed 고정)이라 서버·클라이언트 결과가 같다.
 */
export type WaveOptions = {
  width: number;
  height: number;
  /** 선 개수 */
  count: number;
  /** 가운데 선의 최대 진폭 (height 대비 비율) */
  amplitude: number;
  /** 가로 방향 굴곡 수 */
  frequency: number;
  /** 세로 방향(선이 세로로 흐름) 여부 */
  vertical?: boolean;
};

export function wavePaths(o: WaveOptions): string[] {
  const { width, height, count, amplitude, frequency, vertical } = o;
  const along = vertical ? height : width;
  const across = vertical ? width : height;
  const steps = 64;
  const paths: string[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); // 0..1
    const base = across * (0.04 + t * 0.92);
    // 가운데일수록 크게 요동
    const swell = Math.exp(-((t - 0.5) ** 2) / 0.04);
    const amp = across * amplitude * (0.08 + swell);
    const phase = i * 0.35;

    let d = "";
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      // 드리프트 애니메이션 중에도 끝이 보이지 않도록 화면 밖까지 5%씩 더 그린다
      const a = (u * 1.1 - 0.05) * along;
      const envelope = Math.sin(Math.PI * u) ** 0.6;
      const off =
        amp *
        envelope *
        (Math.sin(u * Math.PI * 2 * frequency + phase) * 0.7 +
          Math.sin(u * Math.PI * 2 * frequency * 2.3 + phase * 1.7) * 0.3);
      const x = vertical ? base + off : a;
      const y = vertical ? a : base + off;
      d += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    paths.push(d);
  }
  return paths;
}
