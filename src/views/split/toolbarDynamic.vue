<template>
  <div class="toolbar-container" ref="toolbarRef">
    <div class="main-buttons">
      <!-- 常驻按钮 -->
      <template v-for="btn in persistentButtons">
        <a-button
          :key="btn.action"
          class="toolbar-btn"
          :title="btn.name"
          :disabled="btn.disabled"
          @click="handleClick(btn.action)"
        >
          <span class="btn-content">
            <span v-if="btn.icon" class="btn-icon">{{ btn.icon }}</span>
            <span v-if="showLabels" class="btn-label">{{ btn.name }}</span>
          </span>
        </a-button>
      </template>

      <!-- 动态按钮 -->
      <template v-for="btn in visibleDynamicButtons">
        <a-button
          :key="btn.action"
          class="toolbar-btn"
          :title="btn.name"
          :disabled="btn.disabled"
          @click="handleClick(btn.action)"
          ref="dynamicButtons"
        >
          <span class="btn-content">
            <span class="btn-icon">{{ btn.icon }}</span>
            <span v-if="showLabels" class="btn-label">{{ btn.name }}</span>
          </span>
        </a-button>
      </template>

      <!-- 更多按钮 -->
      <a-dropdown
        v-if="hiddenButtons.length > 0"
        :trigger="['click']"
        :getPopupContainer="getPopupContainer"
      >
        <a-button class="more-btn">
          <a-icon type="ellipsis" />
        </a-button>
        <a-menu slot="overlay" @click="handleMenuClick">
          <a-menu-item v-for="btn in hiddenButtons" :key="btn.action">
            <span class="menu-item">
              <span class="menu-icon">{{ btn.icon }}</span>
              {{ btn.name }}
            </span>
          </a-menu-item>
        </a-menu>
      </a-dropdown>
    </div>
  </div>
</template>

<script>
import { Button, Dropdown, Menu, Icon } from 'ant-design-vue'
import { debounce } from 'lodash'

// 样式变量
const CSS_VARS = {
  '--btn-bg': '#ffffff',
  '--btn-hover-bg': '#e6f7ff',
  '--btn-border': '#d9d9d9',
  '--btn-radius': '4px',
  '--btn-padding': '6px 12px',
}

// 按钮配置
const TOOLBAR_CONFIG = {
  process: {
    persistent: [
      { action: 'add', name: '新增', icon: '+', fixed: true },
      { action: 'edit', name: '编辑', icon: '✎', fixed: true }
    ],
    dynamic: [
      { action: 'reorder', name: '重编工序号', icon: '🌧' },
      { action: '3d-tool', name: '三维工具', icon: '✅' },
      { action: 'copy', name: '复制', icon: '⎘' }
    ]
  },
  // 其他节点类型配置...
}

export default {
  components: {
    AButton: Button,
    ADropdown: Dropdown,
    AMenu: Menu,
    AMenuItem: Menu.Item,
    AIcon: Icon
  },

  props: {
    nodeType: String,
    disabledActions: {
      type: Array,
      default: () => []
    },
    showLabels: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      availableWidth: 0,
      visibleDynamicCount: 0,
      buttonWidthCache: new Map()
    }
  },

  computed: {
    currentConfig() {
      return TOOLBAR_CONFIG[this.nodeType] || {}
    },

    persistentButtons() {
      return this.currentConfig.persistent?.map(btn => ({
        ...btn,
        disabled: this.disabledActions.includes(btn.action)
      })) || []
    },

    dynamicButtons() {
      return this.currentConfig.dynamic?.map(btn => ({
        ...btn,
        disabled: this.disabledActions.includes(btn.action)
      })) || []
    },

    visibleDynamicButtons() {
      return this.dynamicButtons.slice(0, this.visibleDynamicCount)
    },

    hiddenButtons() {
      return this.dynamicButtons.slice(this.visibleDynamicCount)
    }
  },

  mounted() {
    this.initResizeObserver()
    this.calculateLayout()
    this.injectCSSVars()
  },

  methods: {
    injectCSSVars() {
      Object.entries(CSS_VARS).forEach(([key, value]) => {
        this.$refs.toolbarRef.style.setProperty(key, value)
      })
    },

    getPopupContainer(triggerNode) {
      return triggerNode.parentNode
    },

    initResizeObserver() {
      this.observer = new ResizeObserver(
        debounce(() => {
          this.calculateLayout()
        }, 300)
      )
      this.observer.observe(this.$refs.toolbarRef)
    },

    calculateLayout() {
      const containerWidth = this.$refs.toolbarRef.offsetWidth
      let totalWidth = 0
      const MARGIN = 8
      const MORE_BTN_WIDTH = 60

      // 计算常驻按钮宽度
      this.persistentButtons.forEach(btn => {
        const width = this.getCachedWidth(btn.action)
        totalWidth += width + MARGIN
      })

      // 计算动态按钮
      let visibleCount = 0
      for (const btn of this.dynamicButtons) {
        const btnWidth = this.getCachedWidth(btn.action) + MARGIN
        if (totalWidth + btnWidth + MORE_BTN_WIDTH <= containerWidth) {
          totalWidth += btnWidth
          visibleCount++
        } else {
          break
        }
      }

      this.visibleDynamicCount = visibleCount
    },

    getCachedWidth(action) {
      if (this.buttonWidthCache.has(action)) {
        return this.buttonWidthCache.get(action)
      }

      const btnRef = this.$refs.dynamicButtons?.find(
        c => c.$attrs['data-action'] === action
      )
      const width = btnRef?.$el.offsetWidth || 80
      this.buttonWidthCache.set(action, width)
      return width
    },

    handleMenuClick({ key: action }) {
      this.handleClick(action)
    },

    handleClick(action) {
      if (!this.disabledActions.includes(action)) {
        this.$emit('action', action)
      }
    }
  }
}
</script>

<style scoped>
.toolbar-container {
  display: flex;
  background: #f5f5f7;
  padding: 8px 12px;
  border-bottom: 1px solid #ebedf0;
}

.main-buttons {
  display: flex;
  gap: 8px;
  width: 100%;
}

.toolbar-btn {
  padding: var(--btn-padding);
  border-radius: var(--btn-radius);
  border-color: var(--btn-border);
  background: var(--btn-bg);
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: var(--btn-hover-bg);
  border-color: #40a9ff;
  color: #1890ff;
}

.more-btn {
  margin-left: auto;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-icon {
  font-size: 16px;
}

.btn-label {
  font-size: 14px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-icon {
  font-size: 14px;
}
</style>
