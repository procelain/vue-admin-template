<template>
  <vxe-grid v-bind="gridOptions"> </vxe-grid>
</template>
<script>
import {
  VxeGrid as VxeGrid3,
  VxeTable as VxeTable3
} from 'vxe-table-v3/es/components'
import 'vxe-table-v3/es/vxe-grid/style.css'
import 'vxe-table-v3/es/vxe-table/style.css'
console.log('2222222222222', VxeGrid3, VxeTable3)
export default {
  name: 'VxeTableV3',
  components: {
    // 注册成同名，覆盖全局 v2 注册
    'vxe-grid': VxeGrid3,
    'vxe-table': VxeTable3
  },
  data() {
    const gridOptions = {
      border: true,
      rowConfig: {
        drag: true
      },
      columns: [
        { field: 'name', title: 'Name' },
        { field: 'role', title: 'Role', dragSort: true },
        { field: 'sex', title: 'Sex' },
        { field: 'age', title: 'Age' },
        { field: 'address', title: 'Address' }
      ],
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
    return {
      gridOptions
    }
  }
}
</script>
