import { validatenull } from '@/utils/validate'
import { Message, MessageBox } from 'element-ui'
import { Sortable } from 'sortablejs'
import XEUtils from 'xe-utils'
import VXETable from 'vxe-table'
import * as XLSX from 'xlsx'

VXETable.UUID_prefix = 'seq_' // uuid前缀
VXETable.rowUUID = 0 // 新增行或者导入数据的唯一id
export const gridOptions = {
  data() {
    let _gthis = this
    return {
      highlight_shift_interval: null,
      highlight_shift_setTimeout: null,
      highlight_drap_Interval: null,
      highlight_drap_setTimeout: null,
      sortableRow: null,
      enterStr: '\r\n',
      spaceStr: '\t',
      PROMISE_STATE: {
        PENDING: 'pending',
        FULFILLED: 'fulfilled', // 成功
        REJECTED: 'rejected' // 失败
      },
      gridOptions: {
        zIndex: 1100, // 设置此属性会改善tootip、弹窗等功能的层级，防止别遮住
        class: 'sortable-tree',
        loading: false,
        showOverflow: true,
        showHeaderOverflow: true,
        border: true,
        keepSource: true,
        printConfig: {}, // 打印
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
          rowField: 'id',
          transform: true // 开启虚拟滚动
          // children: "children", // 默认值就是children
          // parentField: "parentId", // 默认值就是parentId
        },
        checkboxConfig: {
          range: true, // 鼠标滑动多选
          checkStrictly: true, // 父子节点不互相关联 (如果要使左移、右移结果正确，此项必须为true)
          checkField: 'checked' // 提升渲染速度(每行数据中需要有这个字段名，叫checked是我随便定义的)
        },
        toolbarConfig: {
          custom: true, // 显示自定义列按钮
          slots: {
            buttons: 'toolbar_buttons'
          },
          refresh: true, // 显示刷新按钮
          print: true, // 显示打印按钮
          zoom: true // 显示全屏按钮
        },
        menuConfig: {
          body: {
            options: [
              [
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
      }
    }
  },
  methods: {
    getUUID(seq) {
      return VXETable.UUID_prefix + seq
    },
    // 新增
    handleAdd() {
      let _self = this
      const $grid = _self.$refs.xGrid
      _self._setRow({ $grid })
    },
    /**
     * 主体新增
     * @param {表格对象, defVal:Object 默认值 } params
     * @param {Function} callback
     * @returns
     */
    _setRow({ $grid, defVal }, callback) {
      let props = $grid.$options.propsData
      if (validatenull(props)) return
      let columns = props.columns
      if (validatenull(columns)) return
      const { fullData } = $grid.getTableData()
      VXETable.rowUUID += 1
      // 创建行数据模板
      let record = {
        id: this.getUUID(VXETable.rowUUID),
        parentId: 0,
        checked: false // checkField
      }
      for (let l = 0; l < columns.length; l++) {
        const col = columns[l]
        let field = col.field || ''
        if (field) {
          if (field !== 'id') {
            record[field] = ''
          }
        }
      }
      // 设置默认值
      if (!validatenull(defVal)) {
        record = Object.assign(record, defVal)
      }
      // 加载数据
      fullData.push(record)
      let rData = XEUtils.toTreeArray(fullData)
      $grid.loadData(rData)
      if (XEUtils.isFunction(callback)) {
        callback({ fullData, record })
      }
    },
    // 批量删除
    handleDeleteAll() {
      let _self = this
      const $grid = _self.$refs.xGrid
      _self._deleteChecked({ $grid })
    },
    /**
     * 批量删除
     * @param {表格对象} params
     * @param {Function} callback
     * @returns
     */
    _deleteChecked({ $grid }, callback) {
      let props = $grid.$options.propsData
      if (validatenull(props)) return
      const { fullData } = $grid.getTableData()
      const options = { children: 'children' }
      const checkedData = $grid.getCheckboxRecords() // 勾选的节点数据
      if (validatenull(checkedData)) {
        Message.warning('请勾选后再进行操作')
        return
      }
      MessageBox.confirm(
        '删除后其子项也将被删除！您确定要批量删除吗？',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(function () {
        for (let i = 0; i < checkedData.length; i++) {
          console.log('[ checkedData ]-194', checkedData)
          const selfRow = checkedData[i]
          const selfNode = XEUtils.findTree(
            fullData,
            (row) => row.id === selfRow.id,
            options
          )

          if (!validatenull(selfNode)) {
            if (validatenull(selfNode.parent)) {
              fullData.splice(selfNode.index, 1)
            } else if (!validatenull(selfNode.items)) {
              selfNode.items.splice(selfNode.index, 1)
            }
          }
        }
        let rData = XEUtils.toTreeArray(fullData)
        $grid.loadData(rData)
        if (XEUtils.isFunction(callback)) {
          callback({ fullData })
        }
      })
    },
    // 取消勾选
    handleCheckedCancel() {
      let _self = this
      const $grid = _self.$refs.xGrid
      _self._checkedCancel({ $grid })
    },
    /**
     * 取消所有勾选
     * @param {Object} params
     * @param {Function} callback
     * @returns
     */
    _checkedCancel({ $grid }, callback) {
      const checkedData = $grid.getCheckboxRecords() // 勾选的节点数据
      if (validatenull(checkedData)) {
        Message.warning('暂无勾选数据')
        return
      }
      $grid.setCheckboxRow(checkedData, false)
      if (XEUtils.isFunction(callback)) {
        callback({ checkedData })
      }
    },
    // 注册左平移
    handleLeft() {
      let _self = this
      const xGrid = _self.$refs.xGrid
      _self._leftShift(xGrid)
    },
    /**
     * 勾选节点左移，以第一条勾选的数据的上一条作为父节点
     * 1.只勾选父节点，则子节点跟随移动
     * 2.勾选父节点同时勾选该父节点包含的子节点，且父子节点相邻则移动到同一父级下。如果不相邻则分别移动到不同的新父级
     * @param {Object} params
     * @param {Function} callback
     * @returns
     */
    _leftShift(xGrid, callback) {
      let _self = this
      const options = { children: 'children' }
      let treeConfig = this.gridOptions.treeConfig
      let rowField = treeConfig.rowField || 'id'
      const { fullData } = xGrid.getTableData()
      let treeData = fullData

      let checkedData = xGrid.getCheckboxRecords() // 勾选的节点数据
      if (checkedData.length == 0) {
        VXETable.modal.message({
          content: '请先勾选节点',
          status: 'warning'
        })
        return
      }
      // 使用勾选数据重新组织成tree型数据
      let parentId = '' // 移动的tree最外层行id
      let childrenParentId = ''
      let movable = true // 是否可移动
      let cursorNextRow = {} // 要移动的行数据在表格中的相邻数据(下一条)
      let checked_matchObj = {}
      let cursorParentRow = {}
      for (let i = 0; i < checkedData.length; i++) {
        let checkedRow = checkedData[i]
        if (!validatenull(checkedData[i + 1])) {
          cursorNextRow = checkedData[i + 1]
        } else {
          cursorNextRow = {}
        }

        if (checkedRow.parentId == 0) {
          // 是普通行直接移动
          // 是整个树全选，移动整个树，并过滤掉其包含的子节点
          parentId = checkedRow.id
          continue
        }
        if (checkedRow.parentId == childrenParentId) {
          continue
        }
        if (checkedRow.parentId == parentId) {
          continue
        }
        if (!validatenull(checkedRow.children)) {
          childrenParentId = checkedRow.id
        }

        // 获取选中节点的第一个节点的上一个节点，当做树的同级
        checked_matchObj = XEUtils.findTree(
          treeData,
          function (item) {
            return checkedRow[rowField] === item[rowField]
          },
          { children: options.children }
        )
        // let matchpath = checked_matchObj.path;
        cursorParentRow = checked_matchObj.parent

        // 如果第一条数据有同级,相邻数据则一起放到第一条数据的同级里
        // 无父级则跳过此条和它相邻的数据
        if (!validatenull(cursorParentRow) && movable) {
          _self._LeftShiftForTreeChild({
            xGrid,
            checkedRow,
            checked_matchObj,
            cursorParentRow
          })
        } else {
          // 校验是否相邻
          let { adjoinStatus } = _self.validateNear({
            xGrid,
            checkedRow,
            cursorNextRow
          })
          // 如果相邻
          if (adjoinStatus) {
            movable = false
            continue
          } else {
            movable = true
          }
        }
      }
      // 加载数据
      let rData = XEUtils.toTreeArray(treeData)
      let { scrollTop, scrollLeft } = xGrid.getScroll()
      xGrid.clearAll()
      Promise.all([xGrid.loadData(rData)]).then(() => {
        setTimeout(() => {
          xGrid.scrollTo(scrollLeft, scrollTop)
        }, 20)
        if (XEUtils.isFunction(callback)) {
          callback(treeData)
        }
      })
    },
    _LeftShiftForTreeChild({
      xGrid,
      checkedRow,
      checked_matchObj,
      cursorParentRow
    }) {
      const options = { children: 'children' }
      let treeConfig = this.gridOptions.treeConfig
      let rowField = treeConfig.rowField || 'id'

      const { fullData } = xGrid.getTableData()
      let treeData = fullData //props.data;

      if (!validatenull(cursorParentRow)) {
        if (!cursorParentRow.children) {
          cursorParentRow.children = []
        }
        let prevParentId = checked_matchObj.parent.id

        let prevParent_matchObj = XEUtils.findTree(
          treeData,
          function (item) {
            return prevParentId === item[rowField]
          },
          { children: options.children }
        )

        if (!validatenull(prevParent_matchObj.parent)) {
          let topParent_matchObj = XEUtils.findTree(
            treeData,
            function (item) {
              return prevParent_matchObj.parent.id === item[rowField]
            },
            { children: options.children }
          )
          if (!validatenull(topParent_matchObj)) {
            if (cursorParentRow.parentId) {
              // 设置父级id
              checkedRow.parentId = prevParent_matchObj.item.parentId
              // // 删除要移动源数据
              // checked_matchObj.items.splice(checked_matchObj["index"], 1);
              // // 向父级添加要移动的数据
              // topParent_matchObj.item.children.push(checkedRow);
            }
          }
        } else {
          // 设置父级id
          checkedRow.parentId = prevParent_matchObj.item.parentId
          // 删除要移动源数据
          // checked_matchObj.items.splice(checked_matchObj["index"], 1);
          // props.data.splice(prevParent_matchObj.index + 1, 0, checkedRow);
        }
      }
    },
    // 注册右平移
    handleRight() {
      let _self = this
      const xGrid = _self.$refs.xGrid
      _self._RightShift(xGrid)
    },
    _RightShift(xGrid, callback) {
      const options = { children: 'children' }
      let treeConfig = this.gridOptions.treeConfig
      let rowField = treeConfig.rowField || 'id'
      const { fullData } = xGrid.getTableData()
      let treeData = fullData
      let checkedData = xGrid.getCheckboxRecords() // 勾选的节点数据
      if (checkedData.length == 0) {
        VXETable.modal.message({
          content: '请先勾选节点',
          status: 'warning'
        })
        return
      }
      // 使用勾选数据重新组织成tree型数据
      let parentId = '' // 移动的tree最外层行id
      let childrenParentId = ''
      let isAdjoinStatus = false // 是否相邻
      let cursorNextRow = {} // 要移动的行数据在表格中的相邻数据(下一条)
      let checked_matchObj = {}
      let cursorParentRow = {} // 要成为父节点的行
      for (let i = 0; i < checkedData.length; i++) {
        let checkedRow = checkedData[i]
        if (!validatenull(checkedData[i + 1])) {
          cursorNextRow = checkedData[i + 1]
        } else {
          cursorNextRow = {}
        }
        // 如果不相邻
        if (!isAdjoinStatus) {
          // 获取选中节点的上一个节点，当做树的父级
          checked_matchObj = XEUtils.findTree(
            treeData,
            function (item) {
              return checkedRow[rowField] === item[rowField]
            },
            { children: options.children }
          )
          let matchpath = checked_matchObj.path
          cursorParentRow =
            checked_matchObj.items[Number(matchpath.slice(-1)[0]) - 1]
        }

        // 如果第一条数据有父级,相邻数据则一起放到第一条数据的父级里
        // 无父级则跳过此条和它相邻的数据
        if (!validatenull(cursorParentRow)) {
          // 设置父级id
          checkedRow.parentId = cursorParentRow.id
        }

        // 如果存在下一条。校验当前数据和下一条是否相邻
        if (!validatenull(cursorNextRow)) {
          let { adjoinStatus } = this.validateNear({
            xGrid,
            checkedRow,
            cursorNextRow
          })
          isAdjoinStatus = adjoinStatus
        } else {
          isAdjoinStatus = false
        }
      }

      // 加载数据
      let rData = XEUtils.toTreeArray(treeData)
      let { scrollTop, scrollLeft } = xGrid.getScroll()
      xGrid.clearAll()
      Promise.all([xGrid.loadData(rData)]).then(() => {
        setTimeout(() => {
          xGrid.scrollTo(scrollLeft, scrollTop)
        }, 20)

        if (XEUtils.isFunction(callback)) {
          callback(treeData)
        }
      })
    },
    /**
     * 校验两条数据是否相邻
     * @param {Object} params
     * @returns
     */
    validateNear({ xGrid, checkedRow, cursorNextRow }) {
      const options = { children: 'children' }
      let treeConfig = this.gridOptions.treeConfig
      let rowField = treeConfig.rowField || 'id'
      const { fullData } = xGrid.getTableData()
      let treeData = fullData

      let adjoinStatus = false
      let cursorNextRowVali = {}
      if (validatenull(cursorNextRow)) {
        return { adjoinStatus, cursorNextRowVali }
      }
      // 获取要移动的行数据在表格中的相邻数据(下一条)
      let matchObj = XEUtils.findTree(
        treeData,
        function (item) {
          return checkedRow[rowField] === item[rowField]
        },
        { children: options.children }
      )
      let matchpath = matchObj.path
      if (!validatenull(matchpath)) {
        let path_data = 'treeData'
        for (let i = 0; i < matchpath.length; i++) {
          const _path = matchpath[i]
          if (i == matchpath.length - 1) {
            path_data += `["${Number(_path) + 1}"]`
          } else {
            path_data += `["${_path}"]`
          }
        }
        cursorNextRowVali = eval(path_data) || {}
      }
      if (!validatenull(cursorNextRowVali)) {
        if (cursorNextRowVali.id === cursorNextRow.id) {
          adjoinStatus = true
        }
      }
      return { adjoinStatus, cursorNextRowVali }
    },
    // 注册行拖动
    rowDrop() {
      let _self = this
      const $grid = _self.$refs.xGrid
      _self.createRowSortable({
        $grid,
        handleClass: '.drag-btn',
        gridOptions: _self.gridOptions,
        dom: '.body--wrapper>.vxe-table--body tbody'
      })
    },
    /**
     * 注册行拖动
     * @param {Object} params   
      grid  -- 操作的表格 
      handleClass: ".drag-btn" -- 拖动选择区域，不传则整行
      dom: ".body--wrapper>.vxe-table--body tbody" 
      multiDrag: false -- 是否可以多选
      selectedClass: "selected-v" -- 多选时选中的样式
     * @param {Function} callback 
     * @returns 
     */
    createRowSortable(params, callback) {
      let _self = this
      let { $grid, handleClass, selectedClass, multiDrag = false, dom } = params
      if (validatenull(dom)) return
      this.sortableRow = Sortable.create($grid.$el.querySelector(dom), {
        handle: handleClass,
        multiDrag: multiDrag, // 多选
        delay: 5,
        fallbackTolerance: 5,
        selectedClass: selectedClass || 'selected-v',
        fallbackOnBody: true,
        onChoose: function (evt) {
          if (multiDrag) {
            const targetRowNode = $grid.getRowNode(evt.item)
            const dragRow = targetRowNode.item
            if (
              !validatenull(targetRowNode) &&
              !validatenull(dragRow.children)
            ) {
              if (!evt.item.classList.contains('selected-v')) {
                evt.item.classList.add('selected-v')
              }
            }
          }
        },
        onEnd: (evt) => {
          const targetTrElem = evt.item
          const oldIndex = evt.oldIndex
          const targetTrElems = evt.items
          const oldIndicies = evt.oldIndicies
          let parentId = ''
          if (!validatenull(targetTrElems) && !validatenull(oldIndicies)) {
            for (let i = 0; i < targetTrElems.length; i++) {
              const targetTrElem = targetTrElems[i]
              // const targetRowNode = $grid.getRowNode(targetTrElem);
              _self._MergeDrop({
                $grid,
                gridOptions,
                targetTrElem,
                oldIndex
              })
            }
          } else {
            _self._MergeDrop({
              $grid,
              gridOptions,
              targetTrElem,
              oldIndex
            })
          }
          if (XEUtils.isFunction(callback)) {
            callback({ evt })
          }
        }
      })
    },
    _MergeDrop({ $grid, targetTrElem, oldIndex }) {
      let _self = this
      const { fullData } = $grid.getTableData()
      let tableTreeData = fullData
      const options = { children: 'children' }
      const wrapperElem = targetTrElem.parentNode
      const prevTrElem = targetTrElem.previousElementSibling
      const targetRowNode = $grid.getRowNode(targetTrElem)
      if (!targetRowNode) {
        return
      }
      const selfRow = targetRowNode.item
      const selfNode = XEUtils.findTree(
        tableTreeData,
        (row) => row === selfRow,
        options
      )
      if (prevTrElem) {
        // 移动到节点
        const prevRowNode = $grid.getRowNode(prevTrElem)
        if (!prevRowNode) {
          return
        }
        const prevRow = prevRowNode.item
        const prevNode = XEUtils.findTree(
          tableTreeData,
          (row) => row === prevRow,
          options
        )
        if (
          XEUtils.findTree(
            selfRow[options.children],
            (row) => prevRow === row,
            options
          )
        ) {
          // 错误的移动
          const oldTrElem = wrapperElem.children[oldIndex]
          wrapperElem.insertBefore(targetTrElem, oldTrElem)
          return Message.error('存在包含节点，请重新调整')
        }
        if (validatenull(selfNode) || validatenull(selfNode.items)) {
          return
        }
        const currRow = selfNode.items.splice(selfNode.index, 1)[0]

        let addIndex = 0
        // 如果是在同父级下移动
        if (
          prevNode.item.parentId == selfNode.item.parentId ||
          prevNode.item.id == selfNode.item.parentId
        ) {
          // 如果从下向上移动+1
          addIndex = selfNode.index < prevNode.index ? 0 : 1
        } else {
          addIndex = 1
        }
        // 设置移动节点的parentId
        // if (validatenull(prevNode.item.parentId) || prevNode.item.parentId == 0) {
        //   if (!validatenull(prevNode.item.children)) {
        //     selfRow.parentId = prevNode.item.id;
        //   } else {
        //     selfRow.parentId = 0;
        //   }
        // } else {
        //   selfRow.parentId = prevNode.item.parentId;
        // }
        // 移动到相邻节点
        if (
          $grid.isTreeExpandByRow(prevRow) &&
          !validatenull(prevRow[options.children])
        ) {
          selfRow.parentId = prevNode.item.id
          // 移动到当前的子节点
          prevRow[options.children].splice(0, 0, currRow)
        } else {
          selfRow.parentId = prevNode.item.parentId
          prevNode.items.splice(prevNode.index + addIndex, 0, currRow)
        }
      } else {
        // 移动到第一行
        if (!validatenull(selfNode) && !validatenull(selfNode.items)) {
          const currRow = selfNode.items.splice(selfNode.index, 1)[0]
          currRow.parentId = 0
          tableTreeData.unshift(currRow)
        }
      }
      // 加载数据
      let rData = XEUtils.toTreeArray(tableTreeData)
      Promise.all([$grid.loadData(rData)]).then(() => {
        _self._DrapTrArea({ $grid, selfRow })
      })
    },
    _DrapTrArea({ $grid, selfRow }) {
      let _self = this
      let tbody = $grid.$el.querySelector(
        '.vxe-table--body-wrapper.body--wrapper'
      ) //操作区
      tbody.querySelectorAll('.drag-highlight').forEach((el) => el.remove())
      clearInterval(this.highlight_drap_Interval)
      this.highlight_drap_Interval = null
      clearTimeout(this.highlight_drap_setTimeout)
      this.highlight_drap_setTimeout = null

      let trs = tbody.getElementsByTagName('tr')
      for (var i = 0; i < trs.length; i++) {
        let tr = trs[i]
        const targetRowNode = $grid.getRowNode(tr)
        const row = targetRowNode.item
        if (row.id == selfRow.id) {
          let tr_offsetHeight = tr.offsetHeight
          let highlight_box_top = document.createElement('div')
          highlight_box_top.classList.add('drag-highlight', 'line-top')
          tr.appendChild(highlight_box_top)
          let highlight_box_right = document.createElement('div')
          highlight_box_right.classList.add('drag-highlight', 'line-right')
          tr.appendChild(highlight_box_right)
          let highlight_bottom = document.createElement('div')
          highlight_bottom.classList.add('drag-highlight', 'line-bottom')
          tr.appendChild(highlight_bottom)
          let highlight_box_left = document.createElement('div')
          highlight_box_left.classList.add('drag-highlight', 'line-left')
          tr.appendChild(highlight_box_left)

          let rows = XEUtils.toTreeArray([selfRow])
          let setStyle = function () {
            let box_height =
              tr_offsetHeight *
              _self.getIsExpandRowsLength({ $grid, data: rows })
            highlight_box_left.style.cssText = `height:${box_height - 1}px`
            highlight_box_right.style.cssText = `height:${box_height - 1}px`
            highlight_bottom.style.cssText = `top:${box_height - 2}px`
          }
          setStyle()
          if (!_self.highlight_drap_Interval) {
            _self.highlight_drap_Interval = setInterval(setStyle, 300)
            _self.highlight_drap_setTimeout = setTimeout(() => {
              clearInterval(_self.highlight_drap_Interval)
              tbody
                .querySelectorAll('.drag-highlight')
                .forEach((el) => el.remove())
            }, 4500)
          }
          break
        }
      }
    },
    /**
     * 获取data所包含的展开节点个数
     * @param {data:Array} params
     * @returns
     */
    getIsExpandRowsLength({ $grid, data }) {
      let includeIds = []
      let IsExpandRowsLength = 0
      for (let i = 0; i < data.length; i++) {
        const treeItem = data[i]
        if (i == 0) {
          includeIds = XEUtils.toTreeArray([treeItem]).map((item) => item.id)
          if ($grid.isTreeExpandByRow(treeItem)) {
            IsExpandRowsLength += includeIds.length
          } else {
            let length =
              IsExpandRowsLength - XEUtils.toTreeArray([treeItem]).length
            IsExpandRowsLength = length < 0 ? 0 : length
            IsExpandRowsLength += 1
          }
        }
        // 不包含
        if (!includeIds.includes(treeItem.id)) {
          if ($grid.isTreeExpandByRow(treeItem)) {
            includeIds = XEUtils.toTreeArray([treeItem]).map((item) => item.id)
            IsExpandRowsLength += includeIds.length
          } else {
            let length =
              IsExpandRowsLength - XEUtils.toTreeArray([treeItem]).length
            IsExpandRowsLength = length < 0 ? 0 : length
            IsExpandRowsLength += 1
          }
        } else {
          if (!$grid.isTreeExpandByRow(treeItem)) {
            let length =
              IsExpandRowsLength - XEUtils.toTreeArray([treeItem]).length
            IsExpandRowsLength = length < 0 ? 0 : length
            IsExpandRowsLength += 1
          }
        }
      }
      return IsExpandRowsLength
    },

    // 注册列拖动
    columnDrop() {
      let _self = this
      const $grid = _self.$refs.xGrid
      _self.sortableColumn = _self.createColumnSortable({
        $grid,
        dom: '.body--wrapper>.vxe-table--header .vxe-header--row',
        handleClass: '.vxe-header--column'
      })
    },
    createColumnSortable(params, callback) {
      let { $grid, handleClass, selectedClass, multiDrag = false, dom } = params
      if (validatenull(dom)) return
      Sortable.create($grid.$el.querySelector(dom), {
        handle: handleClass, // 拖动区域，不传则整行
        multiDrag: multiDrag, // 多选
        selectedClass: selectedClass || 'selected',
        fallbackOnBody: true,
        onEnd: (evt) => {
          const targetThElem = evt.item
          const newIndex = evt.newIndex
          const oldIndex = evt.oldIndex
          const { fullColumn, tableColumn } = $grid.getTableColumn()
          const wrapperElem = targetThElem.parentNode
          const newColumn = fullColumn[newIndex]
          if (newColumn.fixed) {
            // 错误的移动
            const oldThElem = wrapperElem.children[oldIndex]
            if (newIndex > oldIndex) {
              wrapperElem.insertBefore(targetThElem, oldThElem)
            } else {
              wrapperElem.insertBefore(
                targetThElem,
                oldThElem ? oldThElem.nextElementSibling : oldThElem
              )
            }
            Message.error('固定列不允许拖动！')
            return
          }
          // 获取列索引 columnIndex > fullColumn
          const oldColumnIndex = $grid.getColumnIndex(tableColumn[oldIndex])
          const newColumnIndex = $grid.getColumnIndex(tableColumn[newIndex])
          // 移动到目标列
          const currRow = fullColumn.splice(oldColumnIndex, 1)[0]
          fullColumn.splice(newColumnIndex, 0, currRow)
          $grid.loadColumn(fullColumn)
          if (XEUtils.isFunction(callback)) {
            callback()
          }
        }
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
      this._RemoveRow({ $grid, row })
    },
    /**
     * 删除选中行
     * @param {*} params row:Object要删除的行,或者｛id:xxx｝
     * @param {Function} callback
     */
    _RemoveRow({ $grid, row }, callback) {
      const selfRow = row
      const { fullData } = $grid.getTableData()
      const options = { children: 'children' }
      MessageBox.confirm('删除后其子项也将被删除！您确定删除此项吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function () {
        const selfNode = XEUtils.findTree(
          fullData,
          (row) => row.id === selfRow.id,
          options
        )

        if (!validatenull(selfNode)) {
          if (validatenull(selfNode.parent)) {
            fullData.splice(selfNode.index, 1)
          } else if (!validatenull(selfNode.items)) {
            selfNode.items.splice(selfNode.index, 1)
          }
          let rData = XEUtils.toTreeArray(fullData)
          $grid.loadData(rData)
          if (XEUtils.isFunction(callback)) {
            callback({ row })
          }
        }
      })
    },
    // 单元格右键菜单，高亮当前行
    cellContextMenuEvent({ row }) {
      const $grid = this.$refs.xGrid
      $grid.setCurrentRow(row)
    },
    // 上下文菜单
    contextMenuClickEvent(params) {
      let { row, menu, $grid } = params
      let $xGrid = this.$refs.xGrid
      if ($xGrid) {
        switch (menu.code) {
          // 向下插入一条空数据
          case 'insertRow':
            this._InsertRow(params)
            break
          // 向下插入剪贴板数据
          case 'insertForClipboard':
            this.insertForClipboard(params)
            break
          // 删除当前行
          case 'remove':
            if (XEUtils.isFunction(menu.callback)) {
              menu.callback(params)
            } else {
              $grid.remove(row)
            }
            break
          // 批量删除勾选
          case 'removeCkeckedAll':
            this.handleDeleteAll()
            break
        }
      }
    },
    _InsertRow(params) {
      let { menu, row, columns, $grid } = params
      const options = { children: 'children' }
      const { fullData } = $grid.getTableData()
      // tree表格插入
      // 选中节点插入同级
      let treeConfig = this.gridOptions.treeConfig
      let rowField = treeConfig.rowField || 'id'
      let matchObj = XEUtils.findTree(
        fullData,
        function (item) {
          return row[rowField] === item[rowField]
        },
        options
      )

      // 不是树添加
      if (!matchObj.item.parentId) {
        VXETable.rowUUID += 1
        // 创建行数据模板
        let record = {
          id: this.getUUID(VXETable.rowUUID),
          parentId: 0,
          checked: false
        }
        for (let l = 0; l < columns.length; l++) {
          const col = columns[l]
          let field = col.field || '' // config中配置的列的prop名
          if (field) {
            if (field !== 'id') {
              record[field] = '' // 对应行对应列赋值
            }
          }
        }
        fullData.splice(matchObj.index + 1, 0, record)
      }
      // 树添加
      if (matchObj.item.parentId) {
        VXETable.rowUUID += 1
        // 创建行数据模板
        let record = {
          id: this.getUUID(VXETable.rowUUID),
          parentId: row.parentId,
          checked: false
        }
        for (let l = 0; l < columns.length; l++) {
          const col = columns[l]
          let field = col.field || '' // config中配置的列的prop名
          if (field) {
            if (field !== 'id') {
              record[field] = '' // 对应行对应列赋值
            }
          }
        }
        if (validatenull(matchObj.parent)) {
          fullData.splice(matchObj.index + 1, 0, record)
        } else {
          matchObj.parent[options.children].splice(
            matchObj.index + 1,
            0,
            record
          )
        }
      }

      // 加载数据
      let rData = XEUtils.toTreeArray(fullData)
      $grid.loadData(rData)

      if (XEUtils.isFunction(menu.callback)) {
        menu.callback(fullData)
      }
    },
    decidePromiseState(promise) {
      const PROMISE_STATE = {
        PENDING: 'pending',
        FULFILLED: 'fulfilled', // 成功
        REJECTED: 'rejected' // 失败
      }
      const t = {}
      return Promise.race([promise, t])
        .then((v) =>
          v === t ? PROMISE_STATE.PENDING : PROMISE_STATE.FULFILLED
        )
        .catch(() => PROMISE_STATE.REJECTED)
    },
    insertForClipboard(params) {
      let _self = this
      let clipboardRead = window.navigator.permissions.query({
        name: 'clipboard-read'
      })
      if (!clipboardRead) return
      clipboardRead.then((res) => {
        if (res.state == 'denied') {
          Message.error('不支持获取剪切板内容')
          return
        }
        navigator.clipboard
          .read()
          .then(async (data) => {
            let ps_html = 'rejected'
            await _self
              .decidePromiseState(data[0].getType('text/html'))
              .then((state) => {
                ps_html = state
                if (state === 'fulfilled') {
                  data[0].getType('text/html').then((res) => {
                    let reader = new FileReader()
                    //以下这两种方式都可以解析出来，因为Blob对象的数据可以按文本或二进制的格式进行读取
                    //reader.readAsBinaryString(blob);
                    reader.readAsText(res, 'utf8')
                    reader.onload = function () {
                      let fileTxt = this.result //这个就是解析出来的数据
                      let $doc = new DOMParser().parseFromString(
                        fileTxt,
                        'text/html'
                      )
                      const $trs = Array.from($doc.querySelectorAll('table tr'))
                      if (!validatenull($trs)) {
                        // 解析剪贴板数据，生成行数据
                        let rowsInfo = []
                        $trs.forEach((tr) => {
                          let trData = []
                          if (!validatenull(tr.children)) {
                            let childrens = tr.children
                            for (let l = 0; l < childrens.length; l++) {
                              const td = childrens[l]
                              trData.push(td.textContent)
                            }
                            rowsInfo.push(trData)
                          }
                        })
                        if (!validatenull(rowsInfo)) {
                          _self._SetRowData(params, rowsInfo)
                        }
                      }
                    }
                  })
                }
              })
            if (ps_html == 'rejected') {
              _self
                .decidePromiseState(data[0].getType('text/plain'))
                .then((state) => {
                  if (state === 'fulfilled') {
                    data[0].getType('text/plain').then((res) => {
                      let reader = new FileReader()
                      //以下这两种方式都可以解析出来，因为Blob对象的数据可以按文本或二进制的格式进行读取
                      //reader.readAsBinaryString(blob);
                      reader.readAsText(res, 'utf8')
                      reader.onload = function () {
                        let fileTxt = this.result //这个就是解析出来的数据
                        let txtRows = fileTxt.split(_self.enterStr)
                        let rowsInfo = []
                        txtRows.forEach((item) => {
                          let row = item.split(_self.spaceStr)
                          rowsInfo.push(row)
                        })
                        if (!validatenull(rowsInfo)) {
                          _self._SetRowData(params, rowsInfo)
                        }
                      }
                    })
                  }
                })
            }
          })
          .catch((error) =>
            console.error('Failed to read text from clipboard: ', error)
          )
      })
    },
    /**
     * 根据鼠标位置添加行数据
     * @param {*} params
     * @param {Array} rowsInfo - 添加的数据
     */
    _SetRowData(params, rowsInfo) {
      let { menu, row, rowIndex, $grid, columns, columnIndex } = params
      const options = { children: 'children' }
      // 选中节点插入同级
      let treeConfig = this.gridOptions.treeConfig
      let rowField = treeConfig.rowField || 'id'
      const { fullData } = $grid.getTableData()
      let matchObj = XEUtils.findTree(
        fullData,
        function (item) {
          return row[rowField] === item[rowField]
        },
        { children: options.children }
      )
      if (!validatenull(rowsInfo)) {
        let setTaleData = [] // 待插入表格数据
        // 不是树添加
        if (!matchObj.item.parentId) {
          // 使用处理好的数据进行赋值
          for (let i = 0; i < rowsInfo.length; i++) {
            let row = rowsInfo[i]
            VXETable.rowUUID += 1 // 行id
            // 创建行数据模板
            let createRowRecord = {
              id: this.getUUID(VXETable.rowUUID),
              parentId: 0,
              checked: false
            }
            let num = 0 // 有效列下标
            columns.forEach((column, index) => {
              let field = column.field || '' // config中配置的列的prop名
              if (field) {
                if (index >= columnIndex - 1) {
                  let value = ''
                  if (
                    ['name', 'units', 'price', 'amount', 'totalPrice'].includes(
                      field
                    )
                  ) {
                    if (!validatenull(row[num])) {
                      value = row[num].replace(/\s+/g, '')
                    } else {
                      value = row[num] || ''
                    }
                  } else {
                    value = row[num] || ''
                  }
                  createRowRecord[field] = value || '' // 对应行对应列赋值
                  num = num + 1
                }
              }
            })
            setTaleData.push(createRowRecord)
          }
          fullData.splice(rowIndex + 1, 0, ...setTaleData)
        }
        // 树添加
        if (matchObj.item.parentId) {
          let rowIndexCope = Number(matchObj.path.slice(-1)[0])
          // 使用处理好的数据进行赋值
          for (let i = 0; i < rowsInfo.length; i++) {
            let row = rowsInfo[i]
            VXETable.rowUUID += 1 // 行id
            // 创建行数据模板
            let createRowRecord = {
              id: this.getUUID(VXETable.rowUUID),
              parentId: matchObj.item.parentId || 0,
              checked: false
            }
            let num = 0 // 有效列下标
            columns.forEach((column, index) => {
              let field = column.field || '' // config中配置的列的prop名
              if (field) {
                if (index >= columnIndex - 1) {
                  let value = ''
                  if (
                    ['name', 'units', 'price', 'amount', 'totalPrice'].includes(
                      field
                    )
                  ) {
                    if (!validatenull(row[num])) {
                      value = row[num].replace(/\s+/g, '')
                    } else {
                      value = row[num] || ''
                    }
                  } else {
                    value = row[num] || ''
                  }
                  createRowRecord[field] = value || '' // 对应行对应列赋值
                  num = num + 1
                }
              }
            })
            setTaleData.push(createRowRecord)
          }
          if (!matchObj.parent) {
            fullData.splice(matchObj.index + 1, 0, ...setTaleData)
          } else {
            matchObj.parent[options.children].splice(
              rowIndexCope + 1,
              0,
              ...setTaleData
            )
          }
        }
        // 加载数据
        let rData = XEUtils.toTreeArray(fullData)
        $grid.clearAll()
        $grid.loadData(rData)
        if (XEUtils.isFunction(menu.callback)) {
          menu.callback(fullData)
        }
      }
    },
    /**
     * 导入
     * @param {event} e
     * @param {Object} values 默认值 {field:value}
     * @returns
     */
    changeExcel(e, values = {}) {
      let _self = this
      _self.gridOptions.loading = true
      const files = e.target.files
      if (files.length <= 0) {
        return false
      } else if (!/\.(xls|xlsx)$/.test(files[0].name.toLowerCase())) {
        return false
      }
      // 读取表格数据
      const fileReader = new FileReader()
      fileReader.onload = (ev) => {
        const workbook = XLSX.read(ev.target.result, {
          type: 'binary'
        })
        const wsname = workbook.SheetNames[0]
        const ws = XLSX.utils.sheet_to_json(workbook.Sheets[wsname])
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
          temMap[item.title] = item.field
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
        VXETable.rowUUID += 1
        let obj = {
          checked: false,
          parentId: cursorRow.parentId || 0
        }
        for (const name in temMap) {
          if (Object.hasOwnProperty.call(temMap, name)) {
            const _key = temMap[name]

            // 设置导入的值
            if (sourceKeys.includes(name)) {
              obj[_key] = sourceObj[name]
            } else {
              // 设置默认值
              obj[_key] = _key == 'id' ? VXETable.rowUUID : ''
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
      _self.gridOptions.loading = false
    },
    /** 插入数据
     * insertImportData(metadata:元数据,data:插入的数据, cursorRow:插入位置, )
     */
    insertImportData(fullData, data, cursorRow) {
      let _self = this
      let metadata = [...fullData]
      // tree表格插入
      // 选中节点插入同级
      const options = { children: 'children' }
      let treeConfig = _self.gridOptions.treeConfig
      let rowField = treeConfig.rowField || 'id'
      let matchObj = XEUtils.findTree(
        metadata,
        function (item) {
          return cursorRow[rowField] === item[rowField]
        },
        { children: options.children }
      )
      // 不是树添加
      if (!matchObj.item.parentId) {
        metadata.splice(matchObj.index + 1, 0, ...data)
      }
      // 树添加
      if (matchObj.item.parentId) {
        matchObj.parent[options.children].splice(matchObj.index + 1, 0, ...data)
      }
      let rData = XEUtils.toTreeArray(metadata)
      _self.$refs.xGrid.clearAll()
      _self.$refs.xGrid.loadData(rData)
      _self.$refs.inputFile.row = {}
    }
  },
  unmounted() {
    if (this.sortableRow) {
      this.sortableRow.destroy()
    }
  }
}
