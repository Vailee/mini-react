export function getCurrentTime(): number {
  return performance.now()
}

export function isFn(fn: any): fn is (...args: any[]) => any {
  return typeof fn === 'function'
}