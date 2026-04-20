import { describe, it, expect } from "vitest";
import { scheduleCallback } from "../src/Scheduler";
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
} from "../src/SchedulerPriorities";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Scheduler 基础功能测试
 * 
 * 验证任务调度器的核心排序逻辑：
 * 1. 相同优先级：按插入顺序执行 (FIFO)
 * 2. 不同优先级：按优先级数值从小到大执行 (Immediate=1 > UserBlocking=2 > Normal=3 > Low=4)
 */
describe("Scheduler", () => {
  
  it("相同优先级任务应按插入顺序执行", async () => {
    const eventTasks: string[] = [];

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("Task1");
      return null;
    });

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("Task2");
      return null;
    });

    // 等待异步调度执行
    await sleep(50);

    // 预期执行顺序: ["Task1", "Task2"]
    expect(eventTasks).toEqual(["Task1", "Task2"]);
  });

  it("3 个不同优先级的任务应按优先级高低执行", async () => {
    const eventTasks: string[] = [];

    scheduleCallback(LowPriority, () => {
      eventTasks.push("LowPriority");
      return null;
    });

    scheduleCallback(ImmediatePriority, () => {
      eventTasks.push("ImmediatePriority");
      return null;
    });

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("NormalPriority");
      return null;
    });

    // 等待异步调度执行
    await sleep(50);

    // 预期执行顺序: Immediate(1) -> Normal(3) -> Low(4)
    expect(eventTasks).toEqual(["ImmediatePriority", "NormalPriority", "LowPriority"]);
  });

  it("4 个不同优先级的任务应按优先级高低执行", async () => {
    const eventTasks: string[] = [];

    scheduleCallback(LowPriority, () => {
      eventTasks.push("LowPriority");
      return null;
    });

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("NormalPriority");
      return null;
    });

    scheduleCallback(UserBlockingPriority, () => {
      eventTasks.push("UserBlockingPriority");
      return null;
    });

    scheduleCallback(ImmediatePriority, () => {
      eventTasks.push("ImmediatePriority");
      return null;
    });

    // 等待异步调度执行
    await sleep(50);

    // 预期执行顺序: Immediate(1) -> UserBlocking(2) -> Normal(3) -> Low(4)
    expect(eventTasks).toEqual([
      "ImmediatePriority", 
      "UserBlockingPriority", 
      "NormalPriority", 
      "LowPriority"
    ]);
  });

  it("应该支持延迟任务 (delay)", async () => {
    const eventTasks: string[] = [];

    // 调度一个立即执行的任务
    scheduleCallback(NormalPriority, () => {
      eventTasks.push("ImmediateTask");
      return null;
    });

    // 调度一个延迟 100ms 的任务
    scheduleCallback(NormalPriority, () => {
      eventTasks.push("DelayedTask");
      return null;
    }, { delay: 100 });

    // 立即检查，延迟任务不应该执行
    await sleep(50);
    expect(eventTasks).toEqual(["ImmediateTask"]);

    // 等待足够长的时间，让延迟任务执行
    await sleep(100);
    expect(eventTasks).toEqual(["ImmediateTask", "DelayedTask"]);
  });
});
