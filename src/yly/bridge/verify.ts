/**
 * ══════════════════════════════════════════════════
 * bridge/verify.ts — 前端 ↔ 后端变量交叉验证系统
 * ══════════════════════════════════════════════════
 *
 * 职责：
 * 1. 前端 statData 与后端 MVU 变量做双向一致性校验
 * 2. 定时轮询检测差异
 * 3. 差异自动修复（后端优先）
 * 4. 差异日志上报
 * 5. 校验状态暴露给 UI（可显示验证状态指示器）
 * ================================================ */

import { klona } from 'klona';
import { Schema } from '../脚本/schema';

/* ─── 类型定义 ─── */

export interface VerifyResult {
  /** 是否有差异 */
  hasDiff: boolean;
  /** 差异条目列表 */
  diffs: DiffEntry[];
  /** 时间戳 */
  timestamp: number;
  /** 总字段数 */
  totalFields: number;
  /** 一致字段数 */
  matchFields: number;
}

export interface DiffEntry {
  path: string;
  frontendValue: any;
  backendValue: any;
  severity: 'critical' | 'warning' | 'info';
  /** 修复方向: 'backend→frontend' | 'frontend→backend' | 'manual' */
  fixDirection: 'backend→frontend' | 'frontend→backend' | 'manual';
}

export interface VerifyState {
  /** 最近一次校验结果 */
  lastResult: VerifyResult | null;
  /** 校验次数 */
  checkCount: number;
  /** 累计差异数 */
  totalDiffs: number;
  /** 自动修复次数 */
  autoFixCount: number;
  /** 最后同步时间 */
  lastSyncTime: number | null;
  /** 是否启用自动修复 */
  autoFixEnabled: boolean;
  /** 轮询间隔 (ms) */
  pollInterval: number;
}

/* ─── 配置 ─── */

const VERIFY_CONFIG = {
  /** 默认轮询间隔 (30s) */
  DEFAULT_POLL_INTERVAL: 30000,
  /** 最小轮询间隔 (5s) */
  MIN_POLL_INTERVAL: 5000,
  /** AI 生成后延迟校验 (等 MVU 完成解析, 2s) */
  POST_AI_DELAY: 2000,
  /** 关键路径（数值字段差异视为 critical） */
  CRITICAL_PATHS: [
    '好感度', '疲劳', '欲望', '意志', '理智', '魔力值',
    '堕落度', '药物依赖度', '奴化进程', '善恶平衡',
  ],
  /** 文本字段（差异视为 warning） */
  TEXT_PATHS: [
    '内心', '对user的看法', '对士郎的看法',
    '小穴', '胸部', '肛门',
  ],
};

/* ─── 状态 ─── */

let state: VerifyState = {
  lastResult: null,
  checkCount: 0,
  totalDiffs: 0,
  autoFixCount: 0,
  lastSyncTime: null,
  autoFixEnabled: true,
  pollInterval: VERIFY_CONFIG.DEFAULT_POLL_INTERVAL,
};

let pollTimer: ReturnType<typeof setInterval> | null = null;

/* ─── 日志回调 ─── */

type LogCallback = (entry: {
  level: 'info' | 'warn' | 'error' | 'fix';
  message: string;
  details?: any;
}) => void;

let logCallback: LogCallback | null = null;

export function setLogCallback(cb: LogCallback) {
  logCallback = cb;
}

function log(level: 'info' | 'warn' | 'error' | 'fix', message: string, details?: any) {
  const prefix = '[交叉验证]';
  switch (level) {
    case 'info': console.info(prefix, message, details ?? ''); break;
    case 'warn': console.warn(prefix, message, details ?? ''); break;
    case 'error': console.error(prefix, message, details ?? ''); break;
    case 'fix': console.info(`%c${prefix} 🔧 ${message}`, 'color:#4CAF50;font-weight:bold', details ?? ''); break;
  }
  logCallback?.({ level, message, details });
}

/* ─── 核心：从后端读取原始 stat_data ─── */

function readBackendStatData(): Record<string, any> | null {
  try {
    if (typeof Mvu !== 'undefined' && typeof Mvu.getMvuData !== 'undefined') {
      const variables = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
      return _.get(variables, 'stat_data', null);
    }
    const vars = getVariables({ type: 'message' });
    return _.get(vars, 'stat_data', null);
  } catch (e) {
    log('error', '读取后端变量失败', e);
    return null;
  }
}

function writeBackendStatData(data: Record<string, any>): boolean {
  try {
    if (typeof Mvu !== 'undefined' && typeof Mvu.replaceMvuData !== 'undefined') {
      Mvu.replaceMvuData(data, { type: 'message', message_id: getCurrentMessageId() });
      return true;
    }
    const vars = getVariables({ type: 'message' });
    _.set(vars, 'stat_data', data);
    replaceVariables(vars, { type: 'message' });
    return true;
  } catch (e) {
    log('error', '写回后端变量失败', e);
    return false;
  }
}

/* ─── 核心：深度比较两个 stat_data ─── */

function deepCompare(
  frontend: Record<string, any>,
  backend: Record<string, any>,
  basePath = '',
  maxDepth = 5,
): DiffEntry[] {
  if (maxDepth <= 0) return [];
  const diffs: DiffEntry[] = [];

  const allKeys = new Set([
    ...Object.keys(frontend ?? {}),
    ...Object.keys(backend ?? {}),
  ]);

  // 排除内部字段
  const excludeKeys = new Set(['_flags', '_变量', '__v_skip']);

  for (const key of allKeys) {
    if (excludeKeys.has(key)) continue;

    const currentPath = basePath ? `${basePath}.${key}` : key;
    const fv = frontend?.[key];
    const bv = backend?.[key];

    // 类型不同 → 差异
    if (typeof fv !== typeof bv) {
      diffs.push({
        path: currentPath,
        frontendValue: fv,
        backendValue: bv,
        severity: determineSeverity(currentPath, fv, bv),
        fixDirection: 'backend→frontend',
      });
      continue;
    }

    // 对象 → 递归
    if (fv !== null && bv !== null && typeof fv === 'object' && typeof bv === 'object') {
      if (Array.isArray(fv) && Array.isArray(bv)) {
        // 数组：比较长度 + 序列化
        if (JSON.stringify(fv) !== JSON.stringify(bv)) {
          diffs.push({
            path: currentPath,
            frontendValue: fv,
            backendValue: bv,
            severity: 'warning',
            fixDirection: 'backend→frontend',
          });
        }
      } else if (!Array.isArray(fv) && !Array.isArray(bv)) {
        // 普通对象 → 递归
        diffs.push(...deepCompare(fv, bv, currentPath, maxDepth - 1));
      } else {
        // 数组 vs 对象
        diffs.push({
          path: currentPath,
          frontendValue: fv,
          backendValue: bv,
          severity: 'warning',
          fixDirection: 'backend→frontend',
        });
      }
      continue;
    }

    // 原始值比较
    if (fv !== bv) {
      // 数值宽松比较（3.0 vs 3 视为一致）
      if (typeof fv === 'number' && typeof bv === 'number' && Math.round(fv) === Math.round(bv)) {
        continue;
      }
      diffs.push({
        path: currentPath,
        frontendValue: fv,
        backendValue: bv,
        severity: determineSeverity(currentPath, fv, bv),
        fixDirection: 'backend→frontend',
      });
    }
  }

  return diffs;
}

function determineSeverity(path: string, fv: any, bv: any): 'critical' | 'warning' | 'info' {
  const lastSegment = path.split('.').pop() ?? '';

  // 关键数值字段
  if (VERIFY_CONFIG.CRITICAL_PATHS.includes(lastSegment)) {
    if (typeof fv === 'number' && typeof bv === 'number') {
      const diff = Math.abs(fv - bv);
      if (diff >= 5) return 'critical';
      if (diff >= 1) return 'warning';
    }
    return 'warning';
  }

  // 文本字段
  if (VERIFY_CONFIG.TEXT_PATHS.includes(lastSegment)) {
    return 'warning';
  }

  return 'info';
}

/* ─── 核心：执行一次校验 ─── */

export function verify(
  frontendStatData: Record<string, any>,
  backendStatData?: Record<string, any>,
): VerifyResult {
  const backend = backendStatData ?? readBackendStatData();
  if (!backend) {
    const result: VerifyResult = {
      hasDiff: true,
      diffs: [{ path: '$root', frontendValue: 'exists', backendValue: null, severity: 'critical', fixDirection: 'manual' }],
      timestamp: Date.now(),
      totalFields: countFields(frontendStatData),
      matchFields: 0,
    };
    state.lastResult = result;
    state.checkCount++;
    return result;
  }

  const diffs = deepCompare(frontendStatData, backend);
  const totalFields = countFields(frontendStatData);
  const matchFields = totalFields - diffs.length;

  const result: VerifyResult = {
    hasDiff: diffs.length > 0,
    diffs,
    timestamp: Date.now(),
    totalFields,
    matchFields,
  };

  state.lastResult = result;
  state.checkCount++;
  state.totalDiffs += diffs.length;

  if (diffs.length > 0) {
    const criticalCount = diffs.filter(d => d.severity === 'critical').length;
    const warnCount = diffs.filter(d => d.severity === 'warning').length;
    log('warn', `校验发现差异: ${diffs.length} 处 (critical=${criticalCount}, warning=${warnCount})`, diffs);
  } else {
    log('info', `校验通过: ${matchFields}/${totalFields} 字段一致`);
  }

  return result;
}

function countFields(obj: any, depth = 0): number {
  if (depth > 4 || !obj || typeof obj !== 'object') return 1;
  if (Array.isArray(obj)) return obj.length;
  return Object.values(obj).reduce((sum: number, v) => sum + countFields(v, depth + 1), 0);
}

/* ─── 自动修复 ─── */

export function autoFix(
  frontendStatData: Record<string, any>,
): { fixed: boolean; fixedCount: number; newData: Record<string, any> } {
  if (!state.autoFixEnabled) {
    return { fixed: false, fixedCount: 0, newData: frontendStatData };
  }

  const backend = readBackendStatData();
  if (!backend) {
    log('error', '自动修复失败：无法读取后端变量');
    return { fixed: false, fixedCount: 0, newData: frontendStatData };
  }

  const result = verify(frontendStatData, backend);
  if (!result.hasDiff) {
    return { fixed: false, fixedCount: 0, newData: frontendStatData };
  }

  // 以后端为准修复前端
  const newData = klona(backend);
  let fixedCount = 0;

  for (const diff of result.diffs) {
    if (diff.fixDirection === 'backend→frontend') {
      fixedCount++;
      log('fix', `修复: ${diff.path} (后端→前端)`, {
        from: diff.frontendValue,
        to: diff.backendValue,
      });
    }
  }

  state.autoFixCount += fixedCount;
  state.lastSyncTime = Date.now();

  // 也尝试把前端改动的文本字段同步回后端
  const backendFixed = klona(backend);
  let pushToBackend = false;
  for (const diff of result.diffs) {
    if (diff.fixDirection === 'frontend→backend') {
      _.set(backendFixed, diff.path, diff.frontendValue);
      pushToBackend = true;
      fixedCount++;
      log('fix', `回写: ${diff.path} (前端→后端)`, {
        from: diff.backendValue,
        to: diff.frontendValue,
      });
    }
  }

  if (pushToBackend) {
    writeBackendStatData(backendFixed);
  }

  return { fixed: true, fixedCount, newData };
}

/* ─── 定时轮询 ─── */

export function startPolling(
  getFrontendData: () => Record<string, any>,
  onDataUpdate?: (newData: Record<string, any>) => void,
  intervalMs?: number,
) {
  if (pollTimer) stopPolling();

  const interval = Math.max(intervalMs ?? state.pollInterval, VERIFY_CONFIG.MIN_POLL_INTERVAL);
  state.pollInterval = interval;

  log('info', `启动定时校验 (间隔: ${interval}ms)`);

  pollTimer = setInterval(() => {
    const frontendData = getFrontendData();
    const result = verify(frontendData);

    if (result.hasDiff && state.autoFixEnabled) {
      const { fixed, newData } = autoFix(frontendData);
      if (fixed && onDataUpdate) {
        onDataUpdate(newData);
      }
    }
  }, interval);
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    log('info', '定时校验已停止');
  }
}

/* ─── AI 生成后延迟校验 ─── */

let postAiTimer: ReturnType<typeof setTimeout> | null = null;

export function schedulePostAiVerify(
  getFrontendData: () => Record<string, any>,
  onDataUpdate?: (newData: Record<string, any>) => void,
  delayMs?: number,
) {
  if (postAiTimer) clearTimeout(postAiTimer);

  postAiTimer = setTimeout(() => {
    log('info', 'AI 生成后延迟校验');
    const frontendData = getFrontendData();
    const result = verify(frontendData);

    if (result.hasDiff && state.autoFixEnabled) {
      const { fixed, newData } = autoFix(frontendData);
      if (fixed && onDataUpdate) {
        onDataUpdate(newData);
      }
    }
    postAiTimer = null;
  }, delayMs ?? VERIFY_CONFIG.POST_AI_DELAY);
}

/* ─── 获取校验状态 ─── */

export function getVerifyState(): VerifyState {
  return { ...state };
}

export function setAutoFixEnabled(enabled: boolean) {
  state.autoFixEnabled = enabled;
  log('info', `自动修复 ${enabled ? '启用' : '禁用'}`);
}

export function setPollInterval(ms: number) {
  state.pollInterval = Math.max(ms, VERIFY_CONFIG.MIN_POLL_INTERVAL);
}

export function resetVerifyState() {
  state = {
    lastResult: null,
    checkCount: 0,
    totalDiffs: 0,
    autoFixCount: 0,
    lastSyncTime: null,
    autoFixEnabled: true,
    pollInterval: VERIFY_CONFIG.DEFAULT_POLL_INTERVAL,
  };
}

/* ─── 强制全量同步（前端→后端） ─── */

export function forceSyncToBackend(data: Record<string, any>): boolean {
  const validated = Schema.parse(data);
  const ok = writeBackendStatData(validated);
  if (ok) {
    state.lastSyncTime = Date.now();
    state.autoFixCount++;
    log('fix', '强制全量同步: 前端 → 后端');
  }
  return ok;
}

/* ─── 强制全量同步（后端→前端） ─── */

export function forceSyncFromBackend(): Record<string, any> | null {
  const backend = readBackendStatData();
  if (!backend) {
    log('error', '强制同步失败: 无法读取后端');
    return null;
  }
  state.lastSyncTime = Date.now();
  log('fix', '强制全量同步: 后端 → 前端');
  return Schema.parse(backend);
}