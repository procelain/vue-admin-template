<template>
  <div class="anchor-container">
    <!-- 横向锚点导航 -->
    <a-anchor
      :affix="false"
      :showInkInFixed="false"
      class="horizontal-anchor"
    >
      <a-anchor-link
        v-for="item in anchorItems"
        :key="item.key"
        :href="`#${item.key}`"
        :title="item.title"
        class="anchor-item"
        @click="handleAnchorClick(item.key)"
      />
    </a-anchor>

    <!-- 内容区域 -->
    <!-- 折叠面板内容 -->
    <div class="content-container">
      <a-collapse v-model="activePanels" @change="handleCollapseChange">
        <a-collapse-panel
          v-for="section in anchorItems"
          :key="section.key"
          :id="section.key"
          class="collapse-section"
        >
          <template #header>
            <span class="panel-header">{{ section.title }}</span>
          </template>

          <!-- 内容区域 -->
          <div class="panel-content">
            <!-- 属性区块示例 -->
            <template v-if="section.key === '属性'">

            </template>

            <!-- 设备 -->
            <template v-if="section.key === '设备'">
              <a-table
                :columns="columns"
                :dataSource="dataSource"
                size="small"
                bordered
                :pagination="false"
              >
                <template #status="{ text }">
                  <a-badge :status="statusMap[text]" :text="text" />
                </template>
              </a-table>
            </template>
            <!-- 材料 -->
            <template v-if="section.key === '材料'">
              <a-table
                :columns="columns"
                :dataSource="dataSource"
                size="small"
                bordered
                :pagination="false"
              >
                <template #status="{ text }">
                  <a-badge :status="statusMap[text]" :text="text" />
                </template>
              </a-table>
            </template>
            <template v-else>

            </template>
          </div>
        </a-collapse-panel>
      </a-collapse>
  </div>
  </div>
</template>

<script>
export default {
  methods: {
    // 处理锚点点击
    handleAnchorClick(key) {
      // 如果面板未展开，先展开面板
      if (!this.activePanels.includes(key)) {
        this.activePanels = [...this.activePanels, key]
      }

      // 等待DOM更新后滚动定位
      this.$nextTick(() => {
        const element = document.getElementById(key)
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      })
    },

    // 处理折叠面板状态变化
    handleCollapseChange(keys) {
      this.activePanels = keys
    }
  },
  data() {
    return {
      activePanels: [], // 当前展开的面板
      anchorItems: [
        { key: '属性', title: '属性' },
        { key: '设备', title: '设备' },
        { key: '材料', title: '材料' },
        { key: '工装', title: '工装' },
        { key: '说明方文档', title: '说明文档' },
        { key: '参考方文档', title: '参考文档' },
        { key: 'CAD动态文档', title: 'CAD文档' },
        { key: '附件', title: '附件' },
        { key: '分配部件', title: '分配部件' }
      ],
      deviceColumns: [
        { title: '编号', dataIndex: 'code', width: 150 },
        { title: '名称', dataIndex: 'name' },
        { title: '数量', dataIndex: 'quantity', width: 100 },
        { title: '版本', dataIndex: 'version', width: 100 },
        { title: '状态', dataIndex: 'status', width: 120 }
      ],
      deviceData: [
        {
          code: 'SSDSX0000011',
          name: 'SSDSX0000011',
          quantity: 2,
          version: 'D',
          status: 'processing'
        },
        {
          code: 'SSDSX0000012',
          name: 'SSDSX0000012',
          quantity: 2,
          version: 'D',
          status: 'processing'
        },
        {
          code: 'SSDSX0000013',
          name: 'SSDSX0000013',
          quantity: 2,
          version: 'D',
          status: 'processing'
        }
      ]
    }
  },
  // 在mounted中添加平滑滚动逻辑
  mounted() {
    document.querySelectorAll('.ant-anchor-link-title').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const target = document.querySelector(link.getAttribute('href'))
        if (target) {
          window.scrollTo({
            top: target.offsetTop - 80, // 根据header高度调整
            behavior: 'smooth'
          })
        }
      })
    })
  }
}
</script>

<style scoped>
/* 横向锚点导航样式 */
.horizontal-anchor {
  display: flex;
  overflow-x: auto;
  padding: 12px 24px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 24px;
}

.horizontal-anchor >>> .ant-anchor {
  display: flex;
  flex-wrap: nowrap;
}

.horizontal-anchor >>> .ant-anchor-link {
  padding: 0 24px;
  white-space: nowrap;
}

.horizontal-anchor >>> .ant-anchor-ink {
  display: none;
}

/* 内容区域样式 */
.content-section {
  margin: 24px 0;
  padding: 24px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.content-section h2 {
  margin-bottom: 16px;
  color: rgba(0,0,0,0.85);
  font-size: 18px;
}

/* 隐藏滚动条 */
.horizontal-anchor::-webkit-scrollbar {
  display: none;
}

/* 当前激活锚点样式 */
.horizontal-anchor >>> .ant-anchor-link-active {
  border-bottom: 2px solid #1890ff;
  color: #1890ff !important;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .horizontal-anchor >>> .ant-anchor-link {
    padding: 0 12px;
    font-size: 14px;
  }

  .content-section {
    padding: 16px;
  }
}
.content-section >>> .ant-table-thead > tr > th {
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}
</style>
