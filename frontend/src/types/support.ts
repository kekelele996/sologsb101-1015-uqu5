/**
 * 加固件（Support）
 * 支撑杆、拉纤、避雷设施，按检查周期自动提示超期未检查。
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
  /** 最近检查日期 YYYY-MM-DD；空串表示安装后从未检查 */
  lastCheckDate: string
  /**
   * 下次应检查日期 YYYY-MM-DD（固定排期口径，全系统唯一依据）。
   * 登记本次检查时按「上一次应检查日期顺延」重新排期，逾期再补检也不会把节奏推松；
   * 台账下次检查列、顶部超期提醒、超期筛选、养护总览导出均读取此字段。
   */
  nextCheckDate: string
  createdAt: string
  updatedAt: string
  revision: number
}

/** 新建 / 编辑加固件的表单草稿（下次检查日期由系统按口径自动排期，不手工录入） */
export interface SupportDraft {
  treeId: string
  type: SupportType
  installDate: string
  checkCycleMon: number
  lastCheckDate: string
}
