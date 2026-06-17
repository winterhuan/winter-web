# FocusTimer 任务列表优化设计

**日期：** 2025-06-17  
**状态：** 已批准  
**分支：** feat/focus-timer

## 背景

FocusTimer 组件的任务列表当前存在以下问题：
1. 任务项间距过小（`gap: var(--space-2)`），视觉效果拥挤
2. 每行同时放置 checkbox + 标题 + 番茄计数 + 删除按钮，空间紧张
3. 任务项之间缺乏清晰的视觉分隔
4. 没有空状态提示
5. 已完成的 tasks 视觉区分不够明显

## 设计目标

1. **改善间距和布局** — 增大行高、padding 和 gap，让每个任务有足够的呼吸空间
2. **增加视觉分隔** — 任务项之间用细线分隔，层次清晰
3. **焦点任务高亮** — 当前正在番茄钟聚焦的任务有显著视觉标识
4. **拖拽排序** — 支持拖拽调整任务顺序
5. **空状态引导** — 无任务时显示友好提示
6. **已完成任务下沉** — 视觉淡化让已完成任务不干扰活跃任务

## 视觉风格

选择**简洁列表式**风格（类似 Things 3 / Apple Reminders）：

- 圆形 checkbox（空心 → 脉冲橙点 → 绿色实心 ✓）
- 底部细线分隔（`1px solid` border-bottom）
- 较大的行高和 padding
- 左侧拖拽手柄 + 右侧番茄计数
- 已完成任务整体降低透明度 + 删除线

## 实现方案

### 组件结构

所有代码在一个文件 `src/components/products/FocusTimer.astro` 中，分为：
- CSS `<style>` 块 — 所有样式
- HTML 模版 — 任务列表结构
- JS `<script>` 块 — 拖拽排序、任务增删、番茄计数逻辑

### 任务项 HTML 结构

```html
<li class="task-item" data-id="${id}" draggable="true">
  <span class="drag-handle" aria-hidden="true">⋮⋮</span>
  <button class="task-checkbox" aria-label="完成任务">
    <span class="checkbox-dot"></span>
  </button>
  <span class="task-title">{title}</span>
  <span class="task-pomos">{done}/{total} 🍅</span>
  <button class="task-delete" aria-label="删除任务">✕</button>
</li>
```

### CSS 关键样式

```css
.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.15s;
  cursor: default;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item:hover {
  background: var(--color-bg-hover);
}

/* 焦点任务高亮 */
.task-item.is-focused {
  background: linear-gradient(90deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.02) 100%);
  border-left: 3px solid #f59e0b;
}

/* 拖拽手柄 */
.drag-handle {
  cursor: grab;
  color: var(--color-text-muted);
  font-size: 14px;
  user-select: none;
}
.drag-handle:active { cursor: grabbing; }

/* 圆形 checkbox */
.task-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--color-border-strong);
  background: transparent;
  flex-shrink: 0;
  /* 聚焦时脉冲动画 */
  &.is-focused { border-color: #f59e0b; }
  &.is-done { background: #4ade80; border-color: #4ade80; }
}

/* 已完成状态 */
.task-item.is-done {
  opacity: 0.45;
}
.task-item.is-done .task-title {
  text-decoration: line-through;
}

/* 空状态 */
.task-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
  color: var(--color-text-muted);
}
```

### 拖拽排序（JS）

使用原生 HTML5 Drag and Drop API 实现：

1. 每个 `.task-item` 设置 `draggable="true"`
2. `dragstart` — 记录拖拽元素的 index，设置拖拽效果
3. `dragover` — 阻止默认行为以允许 drop
4. `dragenter` — 高亮目标位置（在目标上方显示蓝色插入线）
5. `drop` — 重新排序任务数组，更新 DOM
6. `dragend` — 清除所有拖拽状态

使用 `insertBefore` 原生 DOM 操作重新排列 `<li>` 元素，避免重新渲染整个列表。

### 焦点任务高亮逻辑

- 全局存储 `currentFocusTaskId`
- 开始番茄钟时设置 `currentFocusTaskId`
- 对应 `.task-item[data-id="..."]` 添加 `is-focused` class
- 番茄钟结束时移除 class
- checkbox 内显示橙色脉冲动点动画

### 空状态

当 `tasks.length === 0` 时显示：
```html
<div class="task-empty">
  <span class="task-empty-icon">📝</span>
  <span>还没有任务</span>
  <span>添加一个开始专注吧 🎯</span>
</div>
```

## 兼容性考虑

- 使用 CSS 变量保持与现有设计系统一致
- 拖拽排序使用原生 API，无需额外依赖
- 移动端拖拽体验可能受限，但不影响核心功能
- 暗色主题适配（使用 CSS 变量）

## 实现范围

- [x] 任务列表 CSS 重写（间距、分隔线、checkbox 样式）
- [x] 焦点任务高亮样式和逻辑
- [x] 拖拽排序功能
- [x] 空状态提示
- [x] 已完成任务视觉优化
- [x] 番茄计数格式改为 `done/total`
