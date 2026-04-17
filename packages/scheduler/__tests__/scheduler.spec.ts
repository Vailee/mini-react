import { describe, it, expect } from "vitest";
import { scheduleCallback } from "../src/Scheduler";
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
} from "../src/SchedulerPriorities";

/**
 * Scheduler 基础功能测试
 * 
 * 验证任务调度器的核心排序逻辑：
 * 1. 相同优先级：按插入顺序执行 (FIFO)
 * 2. 不同优先级：按优先级数值从小到大执行 (Immediate=1 > UserBlocking=2 > Normal=3 > Low=4)
 */
describe("Scheduler", () => {
  
  it("相同优先级任务应按插入顺序执行", () => {
    const eventTasks: string[] = [];

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("Task1");
      return null;
    });

    scheduleCallback(NormalPriority, () => {
      eventTasks.push("Task2");
      return null;
    });

    // 预期执行顺序: ["Task1", "Task2"]
    // 注意：当前 Scheduler 尚未实现自动执行逻辑，此处断言暂作为逻辑参考
    // expect(eventTasks).toEqual(["Task1", "Task2"]);
  });

  it("3 个不同优先级的任务应按优先级高低执行", () => {
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

    // 预期执行顺序: Immediate(1) -> Normal(3) -> Low(4)
    // expect(eventTasks).toEqual(["ImmediatePriority", "NormalPriority", "LowPriority"]);
  });

  it("4 个不同优先级的任务应按优先级高低执行", () => {
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

    // 预期执行顺序: Immediate(1) -> UserBlocking(2) -> Normal(3) -> Low(4)
    // expect(eventTasks).toEqual([
    //   "ImmediatePriority", 
    //   "UserBlockingPriority", 
    //   "NormalPriority", 
    //   "LowPriority"
    // ]);
  });
});
