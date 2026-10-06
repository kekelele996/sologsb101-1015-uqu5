/**
 * 加固件（Support）
 * 支撑杆、拉纤、避雷设施，按检查周期自动提示超期未检查。
 *
 * 下次检查日期（nextCheckDate）口径：按「顺延」起算——
 * 登记本次检查后，下次检查日期沿用上一次应检查日期（即原下次检查日期）向后顺延一个周期，
 * 而不是从登记当天重新起算，避免检查节奏越拖越松。
 * 首次登记（无原下次检查日期）时，从登记当天起算一个周期。
 */

/** 加固件类型 */
export type SupportType = '支撑杆' | '拉纤' | '避雷'

export const SUPPORT_TYPE_OPTIONS: SupportType[] = ['支撑杆', '拉纤', '避雷']

export interface Support {
  id: string
  /** 所属古树 */
  treeId: string
  /** 类型 */
  type: SupportType
  /** 安装日期 YYYY-MM-DD */
  installDate: string
  /** 检查周期（月） */
  checkCycleMon: number
  /** 最近检查日期 YYYY-MM-DD；为空表示从未登记检查 */
  lastCheckDate: string
  /** 下次检查日期 YYYY-MM-DD；为空表示尚未建立检查节奏（从未检查） */
  nextCheckDate: string
  createdAt: string
  updatedAt: string
  revision: number
}

/** 新建 / 编辑加固件的表单草稿 */
export interface SupportDraft {
  treeId: string
  type: SupportType
  installDate: string
  checkCycleMon: number
  lastCheckDate: string
}
