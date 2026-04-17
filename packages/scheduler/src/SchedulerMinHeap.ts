/**
 * 最小堆实现
*/

export type Heap<T extends Node > = Array<T>
export type Node = {
  id: number;
  sortIndex: number;
}

// 查看堆顶元素
export function peek<T extends Node>(heap:Heap<T>): T | null {
  return heap[0] || null
}

// 插入元素
export function push<T extends Node>(heap:Heap<T>, node:T): void {
  // 第一步 插入到堆的末尾
  const index = heap.length
  heap.push(node)
  // 第二步 重新调整堆的顺序
  heapifyUp(heap, node, index)
}

// 删除堆顶元素
export function pop<T extends Node>(heap:Heap<T>): T | null {
  // 第一步 删除堆顶元素
  if(heap.length === 0){
    return null
  }
  const first = heap[0]
  const last = heap.pop()!  

  if(first !== last){
    heap[0] = last
    heapifyDown(heap, last, 0)
  }

  // 第二步 为了不调整数组结构，可以先执行数组的pop之后，把尾元素放到堆顶，但是不符合最小堆的性质，需要重新调整堆的顺序
  // 第三步 从0位置节点开始往下调整，与左右子节点比较，交换较小的子节点
  return first
}

function compare(a:Node, b:Node) {
  const diff =  a.sortIndex - b.sortIndex
  return diff !== 0 ? diff : a.id - b.id
}

// 上浮操作
function heapifyUp<T extends Node>(heap:Heap<T>,node:T, i:number): void {
    let index = i
    while(index > 0){
        // 获取父节点索引
        const parentIndex = Math.floor((index - 1) / 2)
        // 如果当前节点大于等于父节点，说明已经到达正确位置
        // 所以直接跳出循环
        // 否则，交换当前节点和父节点
        // 并将当前节点的索引设置为父节点的索引
        if(compare(node, heap[parentIndex]) > 0){
            break
        }
        heap[index] = heap[parentIndex]
        index = parentIndex
    }
    // 最后将当前节点设置到正确位置
    heap[index] = node
}

function heapifyDown<T extends Node>(heap:Heap<T>,node:T, i:number): void {
  let index = i
  const length = heap.length
  const halfLength = length >> 1
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1
    const left = heap[leftIndex]
    const rightIndex = leftIndex + 1
    const right = heap[rightIndex]

    // 如果左子节点小于当前节点
    if (compare(left, node) < 0) {
      // 如果右子节点存在且比左子节点还小
      if (rightIndex < length && compare(right, left) < 0) {
        heap[index] = right
        heap[rightIndex] = node
        index = rightIndex
      } else {
        heap[index] = left
        heap[leftIndex] = node
        index = leftIndex
      }
    } else if (rightIndex < length && compare(right, node) < 0) {
      // 如果左子节点不比当前节点小，但右子节点比当前节点小
      heap[index] = right
      heap[rightIndex] = node
      index = rightIndex
    } else {
      // 子节点都不比当前节点小，调整结束
      return
    }
  }
}