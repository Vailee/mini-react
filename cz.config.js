/** @type {import('cz-git').UserConfig} */
module.exports = {
  useEmoji: true,
  emojiAlign: 'center',
  types: [
    { value: 'feat', name: 'feat:     ✨  新增功能', emoji: ':sparkles:' },
    { value: 'fix', name: 'fix:      🐛  修复缺陷', emoji: ':bug:' },
    { value: 'docs', name: 'docs:     📝  文档更新', emoji: ':memo:' },
    { value: 'style', name: 'style:    💄  代码格式 (不影响逻辑)', emoji: ':lipstick:' },
    { value: 'refactor', name: 'refactor: ♻️   代码重构 (非新增功能或修复 Bug)', emoji: ':recycle:' },
    { value: 'perf', name: 'perf:     ⚡️  性能优化', emoji: ':zap:' },
    { value: 'test', name: 'test:     ✅  新增或修正测试', emoji: ':white_check_mark:' },
    { value: 'build', name: 'build:    📦️  构建系统或外部依赖变更', emoji: ':package:' },
    { value: 'ci', name: 'ci:       🎡  CI 配置或脚本变更', emoji: ':ferris_wheel:' },
    { value: 'chore', name: 'chore:    🔨  日常事务 (不修改 src 或 test 文件)', emoji: ':hammer:' },
    { value: 'revert', name: 'revert:   ⏪️  代码回滚', emoji: ':rewind:' }
  ]
}
