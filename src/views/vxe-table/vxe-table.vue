<template>
  <!-- <vxe-grid v-bind="gridOptions1"> </vxe-grid> -->
</template>
<script>
export default {
  name: 'VxeTable',
  data() {
    return {
      gridOptions1: {
        border: true,
        resizable: true,
        showOverflow: true,
        height: 300,
        align: 'left',
        rowConfig: {
          drag: true
        },
        columns: [
          { type: 'seq', width: 50 },
          { field: 'name', title: 'Name', dragSort: true },
          { field: 'sex', title: 'Sex', showHeaderOverflow: true },
          { field: 'address', title: 'Address', showOverflow: true }
        ],
        data: [
          {
            id: 10001,
            name: 'Test1',
            nickname: 'T1',
            role: 'Develop',
            sex: 'Man',
            age: 0,
            address: 'Shenzhen'
          },
          {
            id: 10002,
            name: 'Test2',
            nickname: 'T2',
            role: 'Test',
            sex: 'Women',
            age: 22,
            address: 'Guangzhou'
          },
          {
            id: 10003,
            name: 'Test3',
            nickname: 'T3',
            role: 'PM',
            sex: 'Man',
            age: 100,
            address: 'Shanghai'
          },
          {
            id: 10004,
            name: 'Test4',
            nickname: 'T4',
            role: 'Designer',
            sex: 'Women',
            age: 70,
            address: 'Shenzhen'
          },
          {
            id: 10005,
            name: 'Test5',
            nickname: 'T5',
            role: 'Develop',
            sex: 'Women',
            age: 10,
            address: 'Shanghai'
          },
          {
            id: 10006,
            name: 'Test6',
            nickname: 'T6',
            role: 'Designer',
            sex: 'Women',
            age: 90,
            address: 'Shenzhen'
          },
          {
            id: 10007,
            name: 'Test7',
            nickname: 'T7',
            role: 'Test',
            sex: 'Man',
            age: 5,
            address: 'Shenzhen'
          },
          {
            id: 10008,
            name: 'Test8',
            nickname: 'T8',
            role: 'Develop',
            sex: 'Man',
            age: 80,
            address: 'Shenzhen'
          }
        ]
      }
    }
  }
}
</script>
