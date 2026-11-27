/**
 * 메이슨리 배치: 작가가 정한 순서대로, 지금 가장 짧은 열에 하나씩 넣는다.
 * (CSS columns는 위→아래로 채워 순서가 흐트러지므로 쓰지 않는다)
 *
 * 열 너비가 모두 같으므로 각 항목의 높이는 세로/가로 비율로 비교할 수 있다.
 * 서버에서 계산하므로 로딩 중에도 레이아웃이 흔들리지 않는다.
 */
export function distributeToColumns<T extends { width: number; height: number }>(
  items: T[],
  columnCount: number,
): { item: T; index: number }[][] {
  const columns: { item: T; index: number }[][] = Array.from(
    { length: columnCount },
    () => [],
  );
  const heights = new Array<number>(columnCount).fill(0);
  // 항목 사이 간격을 대략 반영 (열 너비 대비 비율)
  const GAP = 0.06;

  items.forEach((item, index) => {
    let shortest = 0;
    for (let c = 1; c < columnCount; c++) {
      // 높이가 거의 같으면 왼쪽 열 우선
      if (heights[c] < heights[shortest] - 1e-6) shortest = c;
    }
    columns[shortest].push({ item, index });
    heights[shortest] += item.height / item.width + GAP;
  });

  return columns;
}
