// 统一判定一条记录是否为 mock：
// - API 后端（品牌板块）字段为 isMock；
// - 本地演示模式（IndexedDB demo 账号）字段为 mock。
export function isMockItem(item?: { isMock?: boolean; mock?: boolean } | null): boolean {
  return !!item && (item.isMock === true || item.mock === true);
}
