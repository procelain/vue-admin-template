<template>
  <div>
    <vxe-grid
      ref="xGrid"
      v-bind="gridOptions"
      row-id="id"
      @menu-click="contextMenuClickEvent"
    >
      <template #beginDate_edit="scope">
        <vxe-input
          v-model="scope.row.beginDate"
          type="date"
          @change="dateChange(scope)"
        ></vxe-input>
      </template>
      <template #units_default="{ row }">
        <span :class="unitCodeFormat(row) ? '' : 'vxe-cell--placeholder'">{{
          unitCodeFormat(row) || '请选择单位'
        }}</span>
      </template>
      <template #units_edit="{ row }">
        <vxe-select
          v-model="row.units"
          clearable
          filterable
          placeholder="请选择单位"
        >
          <vxe-option
            v-for="item in unitCodeOptions"
            :key="item.dictValue"
            :value="item.dictKey"
            :label="item.dictValue"
          ></vxe-option>
        </vxe-select>
      </template>
      <template v-slot:operation="{ row }">
        <template v-if="$refs.xGrid.isActiveByRow(row)">
          <vxe-button
            icon="vxe-icon-save"
            status="primary"
            title="保存"
            circle
          ></vxe-button>
        </template>
        <template v-else>
          <vxe-button icon="vxe-icon-edit" title="编辑" circle></vxe-button>
        </template>
        <vxe-button icon="vxe-icon-delete" title="删除" circle></vxe-button>
        <vxe-button icon="vxe-icon-eye-fill" title="查看" circle></vxe-button>
      </template>
    </vxe-grid>
  </div>
</template>

<script>
import { gridOptions } from '@/mixins/grid-options'
import { validatenull } from '@/utils/validate'
export default {
  mixins: [gridOptions],
  data() {
    return {
      gridOptions: {
        height: 810,
        columns: [
          { type: 'seq', width: 70 },
          { field: 'name', title: 'Name' },
          { field: 'sex', title: 'Sex' },
          { field: 'age', title: 'Age' }
        ]
      },
      data: [
        {
          id: 10001,
          name: 'Test1',
          role: 'Develop',
          sex: 'Man',
          age: 28,
          address: 'test abc'
        },
        {
          id: 10002,
          name: 'Test2',
          role: 'Test',
          sex: 'Women',
          age: 22,
          address: 'Guangzhou'
        },
        {
          id: 10003,
          name: 'Test3',
          role: 'PM',
          sex: 'Man',
          age: 32,
          address: 'Shanghai'
        },
        {
          id: 10004,
          name: 'Test4',
          role: 'Designer',
          sex: 'Women',
          age: 24,
          address: 'Shanghai'
        }
      ]
    }
  },
  methods: {
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
    }
  }
}
</script>

<style scoped lang="scss"></style>
