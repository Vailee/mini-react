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
import { lowPriorityTimeout, maxSigned31BitInt, normalPriorityTimeout, userBlockingPriorityTimeout } from "./SchedulerFeatureFlags";

type Callback = (arg: boolean) => Callback | null | undefined;
export type Task = {
  id: number;
  callback: Callback | null;  // 任务回调函数
  priorityLevel: PriorityLevel;  // 任务优先级
  startTime: number;  // 任务开始执行时间
  expirationTime: number;  // 任务过期时间
  sortIndex: number;  // 任务排序索引，用于最小堆的排序
};

// 任务池 通过最小堆实现
const taskQueue: Array<Task> = [];

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

// 任务调度器的入口函数
function scheduleCallback(priorityLevel: PriorityLevel, callback: Callback) {

  const startTime = getCurrentTime();
  let timeout:number;
  switch(priorityLevel){
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
 newTask.sortIndex = expirationTime;
 push(taskQueue, newTask);
 // 加锁
 if (!isHostCallbackScheduled && !isPerformingWork) {
  isPerformingWork = true;
  requestHostCallbackWork(startTime);
 }
}
function requestHostCallbackWork(initialTime: number) {
  
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
function workLoop(initialTime: number) {
let currentTime = initialTime;
currentTask = peek(taskQueue);
while(currentTask !== null){
  if (currentTask.expirationTime>currentTime && shouldYieldToHost()) {
    break;
  }
  // 执行任务
  const callback = currentTask.callback!;
  if(isFn(callback)){
    // 有效的任务
    currentTask.callback = null;
    currentPriorityLevel = currentTask.priorityLevel;
    // 任务是否超时
    const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
    const continuationCallback = callback(didUserCallbackTimeout);
    if(isFn(continuationCallback)){
      // 任务继续执行
      currentTask.callback = continuationCallback;
      return true;
    }else{
      if (currentTask === peek(taskQueue)) {
        pop(taskQueue);
      }
    }
  }else{
    pop(taskQueue)
  }

}
}
export { scheduleCallback, cancelCallback, getCurrentPriorityLevel };
