// 新建 src/utils/vxe-table-v3.js
import VXETableV3 from 'vxe-table-v3'
// 创建全新的 V3 实例（核心隔离技术）
export const v3Instance = VXETableV3.create({
  // 使用全新的前缀避免冲突
  prefix: 'v3'
})
import {
  VxeColumn,
  VxeColgroup,
  VxeGrid,
  VxeTable,
  VxeToolbar
  // 其他需要使用的组件...
} from 'vxe-table-v3' // 通过别名安装的包
import Vue from 'vue'
// 创建独立的作用域实例
export const v3VxeColumn = v3Instance.VxeColumn
export const v3VxeColgroup = v3Instance.VxeColgroup
export const v3VxeGrid = v3Instance.VxeGrid
export const v3VxeTable = v3Instance.VxeTable
export const v3VxeToolbar =v3Instance.VxeToolbar

// 独立配置方法（避免与旧版全局配置冲突）
export const setupV3 = (options) => {
  VxeTable.setup(options)
}

// 创建隔离的组件安装器
// export const installV3Components = (Vue) => {
//   Vue.component('v3-grid', VxeGrid)
//   Vue.component('v3-table', VxeTable)
//   Vue.component('v3-column', VxeColumn)
//   // 注册其他需要的新版组件...
// }
