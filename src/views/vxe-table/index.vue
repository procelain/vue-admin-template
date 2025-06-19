<template>
  <div class="page">
    <SplitPane :pane-length-percent.sync="paneLengthPercent">
      <template slot="one">
<!--        <VxeTable/>-->
      </template>
      <template slot="two">
        <VxeTableV3/>
      </template>
    </SplitPane>
  </div>
</template>

<script>
import SplitPane from '../split/split-pane.vue'
import VxeTable from './vxe-table.vue'
import VxeTableV3 from  './vxe-table-v3.vue'
export default {
  components: {
    SplitPane,
    VxeTable,
    VxeTableV3
  },
  data() {
    return {
      currentNodeType: 'step',
      paneLengthPercent: 50
    }
  },
  methods: {

  }
}
</script>

<style scoped lang="scss">
.page {
  height: 60vh;
  padding: 10px;
  background: #000;
}
</style>
