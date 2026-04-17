import { describe, it, expect } from 'vitest'
import { peek, push, pop, type Heap, type Node } from '../src/SchedulerMinHeap'

/**
 * SchedulerMinHeap 单元测试
 * 
 * 该测试套件用于验证最小堆（Min-Heap）的核心功能：
 * 1. peek: 查看堆顶（最小）元素
 * 2. push: 插入元素并保持最小堆性质
 * 3. pop: 弹出堆顶元素并重新调整堆结构
 * 4. 优先级排序: 当 sortIndex 相同时，通过 id 进行二次排序
 */
describe('SchedulerMinHeap', () => {
  
  // 测试 peek 功能：应当总是返回当前堆中的最小值
  it('should peek the top element', () => {
    const heap: Heap<Node> = [
      { id: 1, sortIndex: 1 },
      { id: 2, sortIndex: 2 },
    ]
    expect(peek(heap)).toEqual({ id: 1, sortIndex: 1 })
  })

  // 测试空堆情况：peek 应当返回 null
  it('should return null when peeking an empty heap', () => {
    const heap: Heap<Node> = []
    expect(peek(heap)).toBeNull()
  })

  // 测试 push 功能：验证插入多个乱序元素后，堆顶是否为最小值
  it('should push elements and maintain min-heap property', () => {
    const heap: Heap<Node> = []
    push(heap, { id: 1, sortIndex: 10 })
    push(heap, { id: 2, sortIndex: 5 })
    push(heap, { id: 3, sortIndex: 15 })
    push(heap, { id: 4, sortIndex: 5 }) // sortIndex 相同，但 id 不同

    // 最小堆性质：父节点的值 <= 子节点的值
    // 此时堆顶的 sortIndex 应当是 5
    expect(peek(heap)?.sortIndex).toBe(5)
  })

  // 测试 pop 功能：验证弹出元素的顺序是否严格按照从小到大排列
  it('should pop elements in correct order', () => {
    const heap: Heap<Node> = []
    push(heap, { id: 1, sortIndex: 10 })
    push(heap, { id: 2, sortIndex: 5 })
    push(heap, { id: 3, sortIndex: 15 })
    push(heap, { id: 4, sortIndex: 7 })

    // 预期的弹出顺序：5 -> 7 -> 10 -> 15
    expect(pop(heap)).toEqual({ id: 2, sortIndex: 5 })
    expect(pop(heap)).toEqual({ id: 4, sortIndex: 7 })
    expect(pop(heap)).toEqual({ id: 1, sortIndex: 10 })
    expect(pop(heap)).toEqual({ id: 3, sortIndex: 15 })
    
    // 全部弹出后应当返回 null
    expect(pop(heap)).toBeNull()
  })

  // 测试优先级冲突：当 sortIndex 相同时，id 较小的节点优先级更高
  it('should handle same sortIndex with different ids', () => {
    const heap: Heap<Node> = []
    // 插入两个 sortIndex 相同但 id 不同的节点
    push(heap, { id: 2, sortIndex: 10 })
    push(heap, { id: 1, sortIndex: 10 })

    // 预期：id 为 1 的节点先弹出
    expect(pop(heap)).toEqual({ id: 1, sortIndex: 10 })
    expect(pop(heap)).toEqual({ id: 2, sortIndex: 10 })
  })
})
