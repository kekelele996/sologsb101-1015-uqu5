/**
 * 树体尺寸与安全判定工具
 * - 胸径与冠幅单位换算
 * - 生长量年化
 * - 倾斜角与空洞安全阈值判定
 * - 加固件检查周期超期判定
 */
import type { Vigor } from '../types/review'
import { today } from './id'

/** 厘米 → 米（保留 3 位小数） */
export function cmToM(cm: number): number {
  return Math.round((cm / 100) * 1000) / 1000
}

/** 米 → 厘米（保留 1 位小数） */
export function mToCm(m: number): number {
  return Math.round(m * 1000) / 10
}

/** 保留 1 位小数 */
export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** 保留 2 位小数 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** 两个日期相差的天数（b - a） */
export function daysBetween(a: string, b: string): number {
  const start = new Date(`${a}T00:00:00`).getTime()
  const end = new Date(`${b}T00:00:00`).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.round((end - start) / 86400000)
}

/**
 * 生长量年化：把两次检查之间的增量折算成「每年」增量。
 * 天数不足 30 天或日期非法时，退回直接差值，避免出现夸张的年化值。
 */
export function annualGrowth(previous: number, current: number, previousDate: string, currentDate: string): number {
  const delta = current - previous
  const days = daysBetween(previousDate, currentDate)
  if (days < 30) return round2(delta)
  return round2((delta / days) * 365)
}

/** 倾斜安全等级 */
export type LeanLevel = 'safe' | 'watch' | 'danger'

/** 倾斜度阈值（度）：< 5 安全，5–10 关注，> 10 危险 */
export const LEAN_WATCH_DEG = 5
export const LEAN_DANGER_DEG = 10

/** 按倾斜角判定安全等级 */
export function leanLevel(leanDeg: number): LeanLevel {
  if (leanDeg > LEAN_DANGER_DEG) return 'danger'
  if (leanDeg >= LEAN_WATCH_DEG) return 'watch'
  return 'safe'
}

/** 倾斜等级中文说明 */
export const LEAN_LEVEL_LABEL: Record<LeanLevel, string> = {
  safe: '倾斜正常',
  watch: '倾斜需关注',
  danger: '倾斜超限',
}

/** 空洞风险提示 */
export function hollowRisk(hollowCount: number): { level: LeanLevel; message: string } {
  if (hollowCount >= 3) {
    return { level: 'danger', message: `发现 ${hollowCount} 处空洞，需立即安排树洞修补并做防腐处理。` }
  }
  if (hollowCount >= 1) {
    return { level: 'watch', message: `发现 ${hollowCount} 处空洞，建议下一年度复壮计划中安排树洞修补。` }
  }
  return { level: 'safe', message: '未见空洞。' }
}

/** 立地状况对应的处置建议 */
export function siteAdvice(siteNote: string): string {
  if (siteNote === '铺装') return '树盘为硬质铺装，建议打透气孔或改造为透气铺装，改善根区通气与水分下渗。'
  if (siteNote === '积水') return '立地存在积水，建议设置排水盲沟并抬高树盘，避免长期沤根。'
  return '立地为裸土，建议覆盖树皮或种植地被，减少水分蒸发与土壤板结。'
}

/** 长势等级排序值（用于取「最新长势」） */
export const VIGOR_ORDER: Record<Vigor, number> = {
  旺盛: 4,
  一般: 3,
  衰弱: 2,
  濒危: 1,
}

/** 取更差的长势等级 */
export function worseVigor(a: Vigor, b: Vigor): Vigor {
  return VIGOR_ORDER[a] <= VIGOR_ORDER[b] ? a : b
}

/**
 * 加固件检查排期（全系统统一口径，见 types/support.ts 的 nextCheckDate 字段说明）：
 *
 * 下次应检查日期是一条「固定排期」——每次登记检查，都从**上一次应检查日期**
 * 顺推一个周期；若已经连续错过多个周期，则一路顺推到登记日之后的第一个应检日。
 * 因此逾期后再补检，检查节奏也不会被推松。
 *
 * - 从未检查的件：以安装日期作为首个周期起点，安装后满一个周期仍未首检即超期；
 * - 周期刚被调短 / 调长：以最近检查日期（未检查过则以安装日期）为锚点用新周期重排，
 *   新应检日落在今天之前就如实显示超期，不顺推、不掩盖欠账；
 * - 一次拖过多个周期：登记一次只把排期推到「登记日之后」的第一个应检日，错过的周期不被注销。
 */

/** 排期锚点：有最近检查日期用最近检查日期，否则用安装日期 */
export function supportScheduleBase(lastCheckDate: string, installDate: string): string {
  return lastCheckDate !== '' ? lastCheckDate : installDate
}

/**
 * 按固定排期口径计算登记本次检查后的下次应检查日期。
 * @param previousDue 登记前的下次应检查日期（固化排期，可能为空，兼容旧数据）
 * @param lastCheckDate 最近检查日期（登记后即本次检查日期）
 * @param installDate 安装日期，从未有过排期时作为首个周期起点
 * @param checkCycleMon 检查周期（月）
 * @param checkDate 本次检查日期，默认今天
 */
export function scheduleNextCheck(
  previousDue: string,
  lastCheckDate: string,
  installDate: string,
  checkCycleMon: number,
  checkDate: string = today(),
): string {
  // 旧数据没有固化排期时，以本次检查日期为锚点补建排期
  const start = previousDue !== '' ? previousDue : supportScheduleBase(lastCheckDate, installDate)
  if (start === '') return ''
  let next = addMonths(start, checkCycleMon)
  // 已连续错过多个周期：一路顺推到本次检查日之后的第一个应检日
  while (next <= checkDate) {
    next = addMonths(next, checkCycleMon)
  }
  return next
}

/**
 * 按锚点直接推算下次应检查日期（不做顺推）：
 * 最近检查日期（未检查过则用安装日期）+ 一个周期。
 * 用于新建 / 编辑加固件与旧数据回填——即使结果落在今天之前也保留，
 * 这样「从未检查」「周期刚被调短」的件保存后会立刻如实显示为超期。
 */
export function anchorNextCheckDate(lastCheckDate: string, installDate: string, checkCycleMon: number): string {
  const base = supportScheduleBase(lastCheckDate, installDate)
  return base === '' ? '' : addMonths(base, checkCycleMon)
}

/**
 * 加固件是否超期未检查。
 * 统一读取固化的下次应检查日期；无固化排期的旧数据用安装日期兜底按周期推算。
 */
export function isSupportOverdue(support: {
  lastCheckDate: string
  installDate: string
  checkCycleMon: number
  nextCheckDate?: string
}, reference = today()): boolean {
  const due = support.nextCheckDate ?? anchorNextCheckDate(support.lastCheckDate, support.installDate, support.checkCycleMon)
  if (due === '') return true
  return due < reference
}

/**
 * 超期天数：相对应检查日期已过去的整天数；未到期为 0。
 * 从未检查 / 无固化排期时同样按固定排期口径取应检日。
 */
export function overdueDays(
  support: {
    lastCheckDate: string
    installDate: string
    checkCycleMon: number
    nextCheckDate?: string
  },
  reference = today(),
): number {
  const due = support.nextCheckDate ?? anchorNextCheckDate(support.lastCheckDate, support.installDate, support.checkCycleMon)
  if (due === '') return 0
  return Math.max(0, daysBetween(due, reference))
}

/** 日期加 n 个月，返回 YYYY-MM-DD */
export function addMonths(date: string, months: number): string {
  const base = new Date(`${date}T00:00:00`)
  if (Number.isNaN(base.getTime())) return ''
  base.setMonth(base.getMonth() + months)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`
}
