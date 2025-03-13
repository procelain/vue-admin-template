<template>
  <div class="toolbar-container">
    <div v-for="(btn, index) in currentToolbar" :key="index" class="toolbar-item">
      <div
        class="icon-btn"
        :title="btn.name"
        @click="handleClick(btn.action)"
      >
        {{ btn.icon }}
      </div>
    </div>
  </div>
</template>

<script>
// 按钮配置映射表
const TOOLBAR_CONFIG = {
  // 工艺节点
  process: [
    { name: '新增工序', icon: '+', action: 'add-step' },
    { name: '重编工序号', icon: '🌧', action: 'reorder' }
  ],
  // 工序节点
  step: [
    { name: '检入', icon: '✅', action: 'check-in' },
    { name: '检出', icon: '✅', action: 'check-out' },
    { name: '撤销检出', icon: '✅', action: 'undo-checkout' },
    { name: '新增工步', icon: '+', action: 'add-substep' },
    { name: '插入工序', icon: '-', action: 'insert-step' },
    { name: '复制工序', icon: '☑', action: 'copy' },
    { name: '删除', icon: '✅', action: 'delete' }
  ],
  // 工步节点
  substep: [
    { name: '插入工步', icon: '-', action: 'insert-substep' },
    { name: '新增工步', icon: '+', action: 'add-substep' },
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
    { name: '三维分配工具', icon: '✅', action: '3d-assign' }
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
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.icon-btn {
  cursor: pointer;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  font-size: 16px;
  transition: all 0.3s;
}

.icon-btn:hover {
  background: #e6f7ff;
  border-color: #40a9ff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
