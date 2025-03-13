<template>
  <div class="toolbar-container">
    <div
      v-for="(btn, index) in currentToolbar"
      :key="index"
      class="toolbar-item"
    >
      <div
        class="icon-btn"
        :class="btn.class"
        :title="btn.name"
        @click="handleClick(btn.action)"
      >
        <svg-icon :icon-class="btn.icon" />
      </div>
    </div>
  </div>
</template>

<script>
// 按钮配置映射表
const TOOLBAR_CONFIG = {
  // 工艺节点
  process: [
    {
      name: '新增工序',
      icon: '1.通用_2.Icon图标_Line_MPM_插入',
      action: 'add-step',
      class: 'common-icon'
    },
    {
      name: '重编工序号',
      icon: '1.通用_2.Icon图标_Line_MPM_插入',
      action: 'reorder',
      class: 'common-icon'
    }
  ],
  // 工序节点
  step: [
    {
      name: '检入',
      icon: '1.通用_2.Icon图标_Line_MPM_插入',
      action: 'check-in'
    },
    { name: '检出', icon: '✅', action: 'check-out' },
    { name: '撤销检出', icon: '✅', action: 'undo-checkout' },
    { name: '新增工步', icon: 'plus3', action: 'add-substep' },
    { name: '插入工序', icon: '-', action: 'insert-step' },
    { name: '复制工序', icon: '☑', action: 'copy' },
    { name: '删除', icon: '✅', action: 'delete' }
  ],
  // 工步节点
  substep: [
    { name: '插入工步', icon: '-', action: 'insert-substep' },
    { name: '新增工步', icon: 'plus3', action: 'add-substep' },
    { name: '删除', icon: '✅', action: 'delete' }
  ],
  // 工艺资源节点
  resource: [
    { name: '查看详情', icon: '☑', action: 'view-detail' },
    { name: '复制', icon: '☑', action: 'copy' },
    { name: '移除', icon: '✅', action: 'remove' }
  ],
  // 公共三维工具
  common3D: [
    {
      name: '三维分配工具',
      icon: '1.通用_2.Icon图标_Line_MPM_三维分配工具',
      action: '3d-assign',
      class: 'bom-icon'
    }
  ]
  // 其他节点类型可继续扩展...
}

export default {
  name: 'TreeToolbar',
  props: {
    nodeType: {
      type: String,
      required: true
    }
  },

  computed: {
    currentToolbar() {
      const baseButtons = []
      // 公共按钮处理（如三维工具）
      if (['process', 'step', 'substep'].includes(this.nodeType)) {
        baseButtons.push(...TOOLBAR_CONFIG.common3D)
      }
      return [...baseButtons, ...(TOOLBAR_CONFIG[this.nodeType] || [])]
    }
  },

  methods: {
    handleClick(action) {
      this.$emit('toolbar-click', action)
    }
  }
}
</script>

<style scoped>
.toolbar-container {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid #ddd;
}
.toolbar-item {
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-btn {
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.icon-btn:hover {
  background: #e6f7ff;
  border-color: #40a9ff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.bom-icon {
  font-size: 20px;
  stroke: #3182dd;
}
.bom-icon::after {
  content: '';
  display: inline-block;
  width: 2px;
  height: 16px;
  background-color: rgb(216, 216, 216);
  margin-left: 8px; /* 调整间距 */
}
.common-icon {
  font-size: 16px;
  stroke: rgba(0, 0, 0, 0.65);
  /* margin-left: 8px; */
}
</style>
