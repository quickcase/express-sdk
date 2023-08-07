const nullFirst = (order) => typeof order === 'number' ? order : -1;

const simpleComparator = (defaultOrder = nullFirst) => (a, b) => defaultOrder(a.order) - defaultOrder(b.order);

export const pageComparator = simpleComparator;

/**
 * Compare fields by column first and order second.
 * Fields without column (`null`) are sorted first.
 * Within a same column, fields without order (`null`) are sorted first.
 */
export const fieldComparator = (defaultOrder = nullFirst) => (a, b) =>
  defaultOrder(a.page_column_no) - defaultOrder(b.page_column_no) || defaultOrder(a.order) - defaultOrder(b.order);

/**
 * Compare complex members by ascending order.
 * Fields without order (`null`) are sorted first.
 */
export const memberComparator = simpleComparator;

export const stateComparator = simpleComparator;

export const tabComparator = simpleComparator;
