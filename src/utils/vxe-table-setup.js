import Vue from 'vue'
import XEUtils from 'xe-utils'
import { VXETable } from 'vxe-table'

// 导入默认的语言
import zhCN from 'vxe-table/lib/locale/lang/zh-CN'

// 按需加载的方式默认是不带国际化的，自定义国际化需要自行解析占位符 '{0}'，例如：
VXETable.setConfig({
  i18n: (key, args) => XEUtils.toFormatString(XEUtils.get(zhCN, key), args)
})
Vue.use(VXETable)
