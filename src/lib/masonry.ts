/**
 * 메이슨리 배치: 작가가 정한 순서대로, 지금 가장 짧은 열에 하나씩 넣는다.
 * (CSS columns는 위→아래로 채워 순서가 흐트러지므로 쓰지 않는다)
 *
 * 결과는 "원래 순서 그대로"의 배열이고, 각 항목에 CSS grid 위치(열, 시작 행, 행 수)를 붙인다.
 * DOM 순서 = 작가가 정한 순서가 되므로 키보드 Tab·화면 낭독기 순서도 맞는다.
 *
 * 행 1칸 = 열 너비의 1/100 (ROW_UNITS_PER_COLUMN). 열 너비가 모두 같으므로
 * 항목 높이는 round(100 × 세로/가로) 칸으로 표현된다. 서버에서 계산하므로
 * 로딩 중에도 레이아웃이 흔들리지 않는다.
 */
export const ROW_UNITS_PER_COLUMN = 100;
/** 항목 사이 세로 간격 (행 칸 수 = 열 너비의 8%. 가로 간격 12/24px과 비슷해지도록) */
const GAP_ROWS = 8;

export type MasonryPlacement<T> = {
  item: T;
  index: number;
  /** 1부터 */
  column: number;
  /** 1부터 */
  rowStart: number;
  rowSpan: number;
};

export function placeMasonry<T extends { width: number; height: number }>(
  items: T[],
  columnCount: number,
): MasonryPlacement<T>[] {
  const heights = new Array<number>(columnCount).fill(0);

  return items.map((item, index) => {
    let shortest = 0;
    for (let c = 1; c < columnCount; c++) {
      // 높이가 같으면 왼쪽 열 우선
      if (heights[c] < heights[shortest]) shortest = c;
    }
    const rowSpan = Math.max(1, Math.round((ROW_UNITS_PER_COLUMN * item.height) / item.width));
    const rowStart = heights[shortest] + 1;
    heights[shortest] += rowSpan + GAP_ROWS;
    return { item, index, column: shortest + 1, rowStart, rowSpan };
  });
}
