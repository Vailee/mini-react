# mini-react
## 规范与工具

### Git 提交规范
项目使用 [husky](https://github.com/typicode/husky) 和 [commitizen](https://github.com/commitizen/cz-cli) 来规范 Git 提交信息。

#### 提交步骤
1. **暂存更改**: `git add .`
2. **启动交互式提交**: `pnpm commit`
3. **选择提交类型**: 根据提示选择 `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore` 等。
4. **填写描述**: 按照提示输入简短描述和详细说明。

## 初始化

```bash
pnpm init
pnpm create vite example --template react-ts

touch pnpm-workspace.yaml
echo "packages: ['packages/*']" >> pnpm-workspace.yaml

// 创建子包 react react-dom react-reconciler shared 并初始化
mkdir packages/react
mkdir packages/react-dom
mkdir packages/react-reconciler
mkdir packages/shared

```

## 多包依赖

- scheduler 依赖 shared
```bash
pnpm add shared --filter scheduler
```
- shared 依赖 react
```bash
pnpm add react --filter shared
```
- react 依赖 scheduler
```bash
pnpm add scheduler --filter react
```



### 代码测试
```bash
# 运行所有测试
pnpm test
```

## 实现任务调度算法
给出一个动态数组，每次都要找出当前状态下的最小值

什么是最小堆？

在完全二叉树中，每个节点的左子树和右子树都是最小堆，且每个节点的值小于等于其左右子树的值。
通过子下标计算父下标，通过父下标计算子下标。
childIndexLeft = (parentIndex + 1) * 2 - 1
parentIndex = (childIndex - 1) >> 1 // 右移一位，等价于除以2

## 实现scheduler 任务 调度器
callback task work 的区别
- callback是任务的初始值
- task 是scheduler封装的任务
- work 是指一个时间切片内的工作单元

## scheduler 入口实现
- 定义task，包含 callback，priorityLevel，starttime， expiration Time等
- 通过最小堆 将新任务添加到堆中
- 加锁， 没有主线程在调度，且没有正在执行的工作单元，才触发host callback work，防止重复添加任务
- 执行requestHostCallbackWork， 触发host callback

## 实现一个requestIdleCallback 函数

