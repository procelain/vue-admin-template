/* global XEUtils:false */
/* global VXETable:false */

import { validatenull } from '@/utils/validate'
import * as XLSX from 'xlsx'
import {
  createColumnSortable,
  createRowSortable,
  handleAdd,
  handleCheckedCancel,
  handleDeleteAll,
  handleLeft,
  handleRight,
  removeRowEvent,
  getClipboardData
} from '@/utils/tableDrap'

export const gridOptions = {
  data() {
    let _gthis = this
    return {
      gridOptions: {
        showOverflow: true,
        showHeaderOverflow: true,
        border: true,
        keepSource: true,
        class: 'sortable-tree',
        stripe: true,
        rowConfig: {
          useKey: true,
          isCurrent: true,
          height: 55
        },
        columnConfig: {
          useKey: true,
          resizable: true
        },
        expandConfig: {
          reserve: true
        },
        treeConfig: {
          expandAll: true,
          children: 'children',
          rowField: 'id',
          transform: true
        },
        checkboxConfig: {
          range: true, // 鼠标滑动多选
          checkStrictly: true, // 父子节点不互相关联
          checkField: 'checked' // 提升渲染速度
        },
        menuConfig: {
          body: {
            options: [
              [
                // {
                //   code: 'pasteForCope',
                //   name: '粘贴',
                //   disabled: false,
                // },
                {
                  code: 'insertRow',
                  name: '向下插入一条空数据',
                  disabled: false
                },
                {
                  code: 'insertForClipboard',
                  name: '向下插入剪贴板数据',
                  disabled: false
                },
                { code: 'importExcel', name: '导入数据', disabled: false },
                {
                  code: 'remove',
                  name: '删除当前行',
                  disabled: false,
                  callback: function ({ row }) {
                    _gthis.removeRowEvent(row)
                  }
                },
                {
                  code: 'removeCkeckedAll',
                  name: '批量删除勾选数据',
                  disabled: false
                }
              ]
            ]
          },
          visibleMethod({ options, column }) {
            const isDisabled =
              !column ||
              ['checked', 'dragBtn', 'id', 'dirType', 'seq'].includes(
                column.field
              )
            options.forEach((list) => {
              list.forEach((item) => {
                item.disabled = isDisabled
              })
            })
            return true
          }
        }
      },
      _selectionArea: null,
      selectedCell: [],
      selectCellStatus: true
    }
  },
  methods: {
    // 单元格鼠标拖拽选取
    selectCell() {
      let _self = this
      _self._selectionArea = new SelectionArea({
        // document object - if you want to use it within an embed document (or iframe).
        // document: ".vxe-grid--table-container",
        class: 'selection-area',
        container: '.vxe-table--body', // 查询选择器或 dom-node 为 selection-area 元素设置容器。
        selectables: ['td'], // 查询可以选择的元素的选择器。
        startareas: ['.vxe-table--body'], // 查询元素的选择器，从中可以开始选择。
        boundaries: ['.vxe-table--body'], // 查询将用作所选内容边界的元素的选择器。
        // px, how many pixels the point should move before starting the selection (combined distance).
        // Or specifiy the threshold for each axis by passing an object like {x: <number>, y: <number>}.
        startThreshold: 20, // 移动多少像素px开始进行选择 {x: <number>, y: <number>}.
        // Enable / disable touch support
        allowTouch: true, // 触摸支持
        // On which point an element should be selected.
        // Available modes are cover (cover the entire element), center (touch the center) or
        // the default mode is touch (just touching it).
        intersect: 'touch', // 选中的时机：整个覆盖cover，移动到中心center, 触摸到touch
        // Specifies what should be done if already selected elements get selected again.
        // invert: Invert selection for elements which were already selected
        // keep: Make stored elements (by keepSelection()) 'fix'
        // drop: Remove stored elements after they have been touched
        overlap: 'invert',
        // Configuration in case a selectable gets just clicked
        singleTap: {
          // Enable single-click selection (Also disables range-selection via shift + ctrl).
          allow: true,
          // 'native' (element was mouse-event target) or 'touch' (element visually touched).
          intersect: 'native'
        },
        scrolling: {
          // On scrollable areas the number on px per frame is devided by this amount.
          // Default is 10 to provide a enjoyable scroll experience.
          speedDivider: 10,
          // Browsers handle mouse-wheel events differently, this number will be used as
          // numerator to calculate the mount of px while scrolling manually: manualScrollSpeed / scrollSpeedDivider.
          manualSpeed: 750
        },
        startScrollMargins: { x: 110, y: 110 }
      })
      _self._selectionArea
        .on('beforestart', (params) => {
          let { event, store } = params
          // console.log('%c [ params ]-132', 'font-size:13px; background:#1ed0fe; color:#62ffff;', params)
          event.preventDefault() // 拖拽时屏蔽选中文字
          event.stopPropagation() // 阻止事件穿透，防止激活输入框
          // return event.target.tagName !== "TD"; // 只识别TD标签
          //   return !event.path.some(item => {
          //     // item is in this case an element affected by the event-bubbeling.
          //     // To exclude elements with class "blocked" you could do the following (#73):
          //     return item.classList.contains('blocked');
          //     // If the areas you're using contains input elements you might want to prevent
          //     // any out-going selections from these elements (#72):
          //     return event.target.tagName !== 'INPUT';
          // });
        })
        .on('start', (params) => {
          let { event } = params
          event.stopPropagation() // 阻止事件穿透，防止激活输入框
          const $grid = _self.$refs.xGrid
          if (event.button != 2 && !event.ctrlKey && !event.metaKey) {
            _self.clearCellActiveClass($grid)
            console.log('[ 清除 ] >')
          }
        })
        .on(
          'move',
          ({
            store: {
              changed: { added, removed }
            },
            event
          }) => {
            // let h = _self._selectionArea.h
            if (event?.button === 0) {
              addClass(added)
              removeClass(removed)
            }
          }
        )
        .on('stop', ({ event }) => {
          event.stopPropagation() // 阻止事件穿透，防止激活输入框
          event.preventDefault() // 拖拽时屏蔽选中文字
          if (event?.button === 0) {
            // _self.selectedCell = store?.selected?.filter((item) => {
            //   return Array(...item.classList).includes('td-mouse-active')
            // })
            _self._selectionArea.keepSelection()
          }
        })
      // 设置默认禁用状态
      _self._selectionArea.disable()
      // 设置单元格选中样式
      function addClass(els) {
        // console.log('%c [ els ]-453', 'font-size:13px; background:#326519; color:#76a95d;', els)
        return els.map((v) => {
          if (!v.classList.contains('td-mouse-active')) {
            v.classList.add('td-mouse-active')
          }
        })
      }
      // 移除单元格选中样式
      function removeClass(els) {
        // console.log('%c [ els ]-462', 'font-size:13px; background:#a4963f; color:#e8da83;', els)
        return els.map((v) => {
          if (v.classList.contains('td-mouse-active')) {
            v.classList.remove('td-mouse-active')
          }
        })
      }
    },
    // 启用禁用标拖拽选取
    selectCellToggle() {
      let _self = this
      const $grid = _self.$refs.xGrid
      if (_self.selectCellStatus) {
        _self._selectionArea.enable()
        _self.listenerPasteAreaCell()
      } else {
        document.removeEventListener('paste', this.listenerPasteAreaFunc)
        _self._selectionArea.disable()
        _self.clearCellActiveClass($grid)
      }
      _self.selectCellStatus = !_self.selectCellStatus
    },
    // 单元格被激活编辑时会触发该事件 @edit-activated="handleEditActivated"
    handleEditActivated(params) {
      this.ActivatCell = params
      // ps 必须独立方法，便于移除监听
      document.addEventListener('paste', this.listenerPasteStartFunc, false)
    },
    listenerPasteStartFunc(event) {
      let _self = this
      _self.pasteForCopeStartCell()
    },
    // 单元格被退出编辑时会触发该事件
    handleEditClosed(params) {
      document.removeEventListener('paste', this.listenerPasteStartFunc)
    },
    // 监听ctrl+v事件2
    listenerPasteAreaCell() {
      // ps 必须独立方法，便于移除监听
      document.addEventListener('paste', this.listenerPasteAreaFunc)
    },
    listenerPasteAreaFunc(event) {
      let _self = this
      const $grid = _self.$refs.xGrid
      // 防止默认行为
      event.preventDefault()
      _self.pasteForCope($grid)
    },
    // 新增
    handleAdd() {
      let _self = this
      const $grid = _self.$refs.xGrid
      handleAdd({ $grid })
    },
    // 批量删除
    handleDeleteAll() {
      let _self = this
      const $grid = _self.$refs.xGrid
      handleDeleteAll({ $grid })
    },
    // 取消勾选
    handleCheckedCancel() {
      let _self = this
      const $grid = _self.$refs.xGrid
      handleCheckedCancel({ $grid })
    },

    // 注册左平移
    handleLeft() {
      let _self = this
      const xGrid = _self.$refs.xGrid
      handleLeft(xGrid)
    },
    // 注册右平移
    handleRight() {
      let _self = this
      const xGrid = _self.$refs.xGrid
      handleRight(xGrid)
    },
    // 注册行拖动
    rowDrop() {
      let _self = this
      const $grid = _self.$refs.xGrid
      _self.sortableRow = new createRowSortable({
        $grid,
        handleClass: '.drag-btn',
        gridOptions: _self.gridOptions,
        dom: '.body--wrapper>.vxe-table--body tbody'
      })
    },
    // 注册列拖动
    columnDrop() {
      let _self = this
      const $grid = _self.$refs.xGrid
      _self.sortableColumn = new createColumnSortable({
        $grid,
        dom: '.body--wrapper>.vxe-table--header .vxe-header--row',
        handleClass: '.vxe-header--column'
      })
    },
    // 删除某行指定字段数据
    // row: Object 当前行，keys:Array 要删除值的字段名
    deleteValueForRow(row, keys) {
      if (!validatenull(row) && !validatenull(keys)) {
        keys.forEach((key) => {
          row[key] ? (row[key] = '') : ''
        })
      }
    },
    // 删除表格数据
    removeRowEvent(row) {
      const $grid = this.$refs.xGrid
      removeRowEvent({ $grid, row })
    },
    // 单元格右键菜单，高亮当前行
    cellContextMenuEvent({ row }) {
      const $grid = this.$refs.xGrid
      $grid.setCurrentRow(row)
    },
    // 上下文菜单
    contextMenuClickEvent(params) {
      let { menu, row, $grid } = params
      if ($grid) {
        switch (menu.code) {
          // 粘贴数据
          case 'pasteForCope':
            this.pasteForCope($grid)
            break
          // 导入数据
          case 'importExcel':
            this.$refs.inputFile.row = row
            this.$refs.inputFile.click()
            break
          // 批量删除勾选
          case 'removeCkeckedAll':
            this.handleDeleteAll()
            break
        }
      }
    },
    // 根据鼠标框选范围粘贴数据
    pasteForCope($grid) {
      let _self = this
      // 根据框选范围开始赋值，横纵依次类推
      let selectedCell = _self._selectionArea.getSelection()
      if (!validatenull(selectedCell)) {
        // console.log('%c [ selected ]-298', 'font-size:13px; background:#2bb077; color:#6ff4bb;', _self.selectedCell)
        // 获取剪贴板数据进行赋值。赋值规则为 从左到右 从上到下。如果剪贴板中只有一行一列的数据，则对所有已框选的单元格使用相同值进行赋值，同excel操作
        // 数据量大的话还有效率优化空间， 建议：把框选的数据组织成和剪贴板一样的结构，遍历剪贴版数据进行赋值
        getClipboardData(({ data }) => {
          if (!validatenull(data)) {
            let { fullData } = $grid?.getTableData()
            let fData = XEUtils.toTreeArray(fullData)
            let cpRowIndex = -1
            let cpColIndex = 0
            let cpRow = []
            let _selectRowIndex = ''
            selectedCell.forEach((td, index) => {
              const column = $grid.getColumnNode(td)
              const field = column?.item?.field || ''
              if (!validatenull(field)) {
                const rowNode = $grid.getRowNode(td.parentNode)
                let selectRowIndex = $grid.getVTRowIndex(rowNode.item)
                if (selectRowIndex !== _selectRowIndex) {
                  _selectRowIndex = selectRowIndex
                  cpRowIndex++
                  cpColIndex = 0
                  cpRow = data?.[cpRowIndex] || []
                }
                let dataRow = fData[selectRowIndex]
                if (!validatenull(cpRow[cpColIndex])) {
                  dataRow[field] = cpRow[cpColIndex]
                  cpColIndex++
                } else {
                  return
                }
              }
            })
            _self.clearCellActiveClass($grid)
          }
        })
      } else {
        _self.$message.warning('请框选要粘贴的数据区域！')
      }
    },
    // 以鼠标选中单元格做起始点粘贴数据
    pasteForCopeStartCell() {
      let _self = this
      const { $columnIndex, rowIndex, $grid } = _self.ActivatCell
      const columns = $grid.getColumns()
      // 取消单元格编辑状态 全局
      $grid.clearEdit()
      // 以选中单元格开始赋值，横纵依次类推
      let startColumnIndex = $columnIndex
      let startRowIndex = rowIndex
      // 获取剪贴板数据进行赋值。赋值规则为 从左到右 从上到下。
      getClipboardData(({ data, sourceData, type }) => {
        let contentText = []
        if (type === 'text/html') {
          contentText = [[sourceData.documentElement.textContent]]
        } else if (type === 'text/plain') {
          contentText = [[sourceData]]
        }
        let _data = data.length > 0 ? data : contentText
        if (!validatenull(_data)) {
          let { fullData } = $grid?.getTableData()
          let fData = XEUtils.toTreeArray(fullData)
          _data.forEach((cpRow) => {
            for (let i = 0; i < cpRow.length; i++) {
              if (
                validatenull(columns[startColumnIndex]) ||
                validatenull(fData[startRowIndex])
              ) {
                break
              }
              let field = columns[startColumnIndex]?.field ?? ''
              fData[startRowIndex][field] = cpRow[i] ?? ''
              startColumnIndex += 1
            }
            startColumnIndex = $columnIndex
            startRowIndex += 1
          })
        }
      })
    },
    // 清除选中单元格样式
    clearCellActiveClass($grid) {
      this._selectionArea.clearSelection()
      let tbody = $grid.$el.querySelector(
        '.vxe-table--body-wrapper.body--wrapper'
      )
      let trs = tbody.getElementsByTagName('tr')
      for (var i = 0; i < trs.length; i++) {
        let tr = trs[i]
        let tds = tr.getElementsByTagName('td')
        for (var j = 0; j < tds.length; j++) {
          let td = tds[j]
          if (td.classList.contains('td-mouse-active')) {
            td.classList.remove('td-mouse-active')
          }
        }
      }
    },
    // 导入 e:event, 默认值 values:{field:value}
    changeExcel(e, values = {}) {
      let _self = this
      _self.tabLoading('导入中···')
      const files = e.target.files
      if (files.length <= 0) {
        return false
      } else if (!/\.(xls|xlsx)$/.test(files[0].name.toLowerCase())) {
        _self.$message.error('请导入xls、xlsx格式文件！')
        _self.tabLoading().close()
        return false
      }
      // 读取表格数据
      const fileReader = new FileReader()
      fileReader.onload = (ev) => {
        const workbook = XLSX.read(ev.target.result, {
          type: 'binary'
        })
        const wsname = workbook.SheetNames[0]
        const ws = XLSX.utils.sheet_to_json(workbook.Sheets[wsname], {
          raw: false
        }) // raw 以字符串形式读取数据
        _self.dealExcel(ws, values) //转换数据格式
      }
      fileReader.readAsBinaryString(files[0])
      _self.$refs.inputFile.value = ''
    },
    dealExcel(ws, values) {
      let _self = this
      const { fullData } = _self.$refs.xGrid.getTableData()
      // 转换的开头f
      let temMap = {}
      let columns = _self.gridOptions.columns
      columns.forEach((item) => {
        if (item.title && item.field) {
          if (!temMap[item.title]) {
            temMap[item.title] = item.field
          }
        }
      })
      // 校验是否为标准数据模板
      // if (ws.length != 0) {
      //   let row1 = ws[0];
      //   let row1Keys = Object.keys(row1);
      //   let temKeys = Object.keys(temMap);
      //   // 1. 验证列数是否相等
      //   if (row1Keys.length !== temKeys.length) {
      //     this.$message.error("导入失败！数据列数不相同", 2000);
      //     return;
      //   }
      //   // 2. 验证列名称是否相等
      //   for (let k = 0; k < temKeys.length; k++) {
      //     const keyName = temKeys[k];
      //     if (keyName !== row1Keys[k]) {
      //       this.$message.error(
      //         `导入失败！数据列名称“${row1Keys[k]}”错误`,
      //         2000
      //       );
      //       return;
      //     }
      //   }
      // }
      // 表格数据为空，外部导入
      if (validatenull(fullData)) {
        _self.$refs.inputFile.row = {}
      }
      let cursorRow = _self.$refs.inputFile.row || {}
      let wsData = []
      let valuesKeys = Object.keys(values)
      ws.forEach((sourceObj) => {
        let sourceKeys = Object.keys(sourceObj)
        VXETable.importUUID += 1
        let obj = {
          checked: false,
          parentId: cursorRow.parentId || 0
        }
        for (const name in temMap) {
          if (Object.hasOwnProperty.call(temMap, name)) {
            const _key = temMap[name]

            // 设置导入的值
            if (sourceKeys.includes(name)) {
              //eg 如果设置raw : false，则时间不需要formatExcelDate转换
              // if(name.indexOf("时间")>-1 || name.indexOf("日期")>-1 ){
              //   obj[_key] = formatExcelDate(sourceObj[name]);
              // }else{
              //   obj[_key] = sourceObj[name];
              // }
              obj[_key] = sourceObj[name]
            } else {
              // 设置默认值
              obj[_key] = _key == 'id' ? VXETable.importUUID : ''
              if (valuesKeys.includes(_key)) {
                obj[_key] = values[_key]
              }
            }
          }
        }
        wsData.push(obj)
      })

      // 外部导入
      if (validatenull(cursorRow) && !validatenull(wsData)) {
        let metadata = fullData.concat(wsData)
        let rData = XEUtils.toTreeArray(metadata)
        _self.$refs.xGrid.loadData(rData)
      }
      // 如果右键菜单导入
      if (!validatenull(cursorRow) && !validatenull(wsData)) {
        _self.insertImportData(fullData, wsData, cursorRow)
      }
      _self.tabLoading().close()
    },
    /** 插入数据
     * insertImportData(metadata:元数据,data:插入的数据, cursorRow:插入位置, )
     */
    insertImportData(fullData, data, cursorRow) {
      let _self = this
      let metadata = [...fullData]
      // tree表格插入
      // 选中节点插入同级
      let treeConfig = _self.gridOptions.treeConfig
      let rowField = _self.gridOptions.treeConfig.rowField
      let matchObj = XEUtils.findTree(
        metadata,
        function (item) {
          return cursorRow[rowField] === item[rowField]
        },
        { children: treeConfig.children }
      )
      // 不是树添加
      if (!matchObj.item.parentId) {
        metadata.splice(matchObj.index + 1, 0, ...data)
      }
      // 树添加
      if (matchObj.item.parentId) {
        matchObj.parent[treeConfig.children].splice(
          matchObj.index + 1,
          0,
          ...data
        )
      }
      let rData = XEUtils.toTreeArray(metadata)
      _self.$refs.xGrid.clearAll()
      _self.$refs.xGrid.loadData(rData)
      _self.$refs.inputFile.row = {}
    }
  },
  deactivated() {
    document.removeEventListener('paste', this.listenerPasteStartFunc)
    document.removeEventListener('paste', this.listenerPasteAreaFunc)
  },
  beforeDestory() {
    this._selectionArea?.destroy()
  }
}
