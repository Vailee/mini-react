/**
 * 任务调度器
 * 实现一个单线程的任务调度器
 * */

import { getCurrentTime, isFn } from "@shared/src/utils";
import { peek, pop, push } from "./SchedulerMinHeap";
import {
  NoPriority,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
  type PriorityLevel,
} from "./SchedulerPriorities";
import {
  lowPriorityTimeout,
  maxSigned31BitInt,
  normalPriorityTimeout,
  userBlockingPriorityTimeout,
} from "./SchedulerFeatureFlags";

type Callback = (arg: boolean) => Callback | null | undefined;
export type Task = {
  id: number;
  callback: Callback | null; // 任务回调函数
  priorityLevel: PriorityLevel; // 任务优先级
  startTime: number; // 任务开始执行时间
  expirationTime: number; // 任务过期时间
  sortIndex: number; // 任务排序索引，用于最小堆的排序
};

// 任务池 通过最小堆实现
const taskQueue: Array<Task> = []; // 没有延迟的任务
const timerQueue: Array<Task> = []; // 有延迟的任务，

// 任务id计数器,标记task的唯一性
let taskIdCounter = 1;

let currentTask: Task | null = null;
let currentPriorityLevel: PriorityLevel = NoPriority;
// 记录时间切片的起始值，时间戳
let startTime: number = -1;
// 时间切片
let frameInterval: number = 5;

// 锁，防止重复调度
// 是否有work在运行
let isPerformingWork = false;
// 主线程是否在调度
let isHostCallbackScheduled = false;
// 是否正在运行消息循环
let isMessageLoopRunning = false;
// 是否有任务在倒计时
let isHostTimeoutScheduled = false;

let taskTimeoutID = -1;
// 任务调度器的入口函数
function scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: { delay: number },
) {
  let startTime: number;
  const currentTime = getCurrentTime();

  if (options?.delay && options.delay > 0) {
    const { delay } = options;
    // 有延迟的任务，加入时间队列
    startTime = currentTime + delay;
  } else {
    startTime = currentTime;
  }
  let timeout: number;
  switch (priorityLevel) {
    case ImmediatePriority: // 立即执行
      timeout = -1;
      break;
    case UserBlockingPriority: // 用户阻塞优先级
      timeout = userBlockingPriorityTimeout;
      break;
    case NormalPriority:
      // 正常优先级的任务，
      timeout = normalPriorityTimeout;
      break;
    case LowPriority:
      // 低优先级的任务，
      timeout = lowPriorityTimeout;
      break;
    case IdlePriority:
      // 空闲优先级的任务，过期时间为最大时间戳
      timeout = maxSigned31BitInt;
      break;
    default:
      timeout = normalPriorityTimeout;
      break;
  }
  const expirationTime = startTime + timeout;

  const newTask: Task = {
    id: taskIdCounter++,
    callback: callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };

  if (startTime > currentTime) {
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    // 每次只倒计时一个任务
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        // 满足这个条件 代表 newTask是堆顶任务,但是有任务在倒计时，需要取消
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // 开启倒计时
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // 无延迟的任务，加入任务队列
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    // 加锁，没有主线程在调度，且没有正在执行的工作单元，才触发host callback work
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallbackWork();
    }
  }
}

function requestHostCallbackWork() {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

function performWorkUntilDeadline() {
  if (isMessageLoopRunning) {
    const currentTime = getCurrentTime();
    startTime = currentTime;
    let hasMoreWork = false;
    // 执行任务
    try {
      hasMoreWork = flushWork(currentTime);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
      }
    }
  }
}

function flushWork(initialTime: number) {
  isHostCallbackScheduled = false;
  isPerformingWork = true;
  let previousPriorityLevel = currentPriorityLevel;
  try {
    return workLoop(initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

// 创建宏任务
const channel = new MessageChannel();
const port2 = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

function schedulePerformWorkUntilDeadline() {
  port2.postMessage(null);
}

// 取消任务, 由于最小堆没法直接删除，只能初步将task.callback设置为null
// 后续任务中，当该任务位于堆顶时，会被跳过
function cancelCallback(callback: Callback) {
  currentTask!.callback = null;
}

function getCurrentPriorityLevel() {
  return currentPriorityLevel;
}

// TODO 是否应该 yield 到主机环境
function shouldYieldToHost(): boolean {
  const timeElapsed = getCurrentTime() - startTime;
  return timeElapsed >= frameInterval;
}

function workLoop(initialTime: number): boolean {
  let currentTime = initialTime;
  // 检查timerQueue是否有任务需要先处理
  advanceTimers(currentTime); 
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }
    // 执行任务
    const callback = currentTask.callback!;
    if (isFn(callback)) {
      // 有效的任务
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      // 任务是否超时
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime(); // 更新当前时间
      if (isFn(continuationCallback)) {
        // 任务继续执行
        currentTask.callback = continuationCallback;
        advanceTimers(currentTime); // 检查是否有新的任务需要处理
        return true;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime); // 检查是否有新的任务需要处理
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }

  if (currentTask !== null) {
    return true;
  } else {
    // 主线程闲置时，检查timerQueue是否有任务需要处理
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}

function requestHostTimeout(
  callback: (currentTime: number) => void,
  ms: number,
) {
  taskTimeoutID = setTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}

// delay任务处理逻辑
function cancelHostTimeout() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}
/**
 * 把timerQueue中已到时间的任务推入taskQueue currentTime 当前时间
 **/
function advanceTimers(currentTime: number) {
  let timer = peek(timerQueue);
  while (timer !== null) {
    if (timer.callback === null) {
      // 无效的任务
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // 有效的任务
      // 任务已经到达开始时间，可以推入taskQueue
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      return;
    }
    timer = peek(timerQueue);
  }
}

function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false;
  //  把延迟任务从timerQueue中推入taskQueue
  advanceTimers(currentTime);

  // 主线程没有任务在执行，且没有正在执行的工作单元，才触发host callback work
  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallbackWork();
    } else {
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

export { scheduleCallback, cancelCallback, getCurrentPriorityLevel };
