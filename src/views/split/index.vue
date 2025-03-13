<template>
  <div class="page">
    <SplitPane :pane-length-percent.sync="paneLengthPercent">
      <template slot="one">
        <TreeToolbar :nodeType="currentNodeType" @toolbar-click="handleAction"/>
      </template>
      <template slot="two"></template>
    </SplitPane>
  </div>
</template>

<script>
import SplitPane from "./split-pane";
import TreeToolbar from './toolbar.vue'
export default {
  components: {
    SplitPane,
    TreeToolbar
  },
  data() {
    return {
      currentNodeType: 'process',
      paneLengthPercent: 30,
    };
  },
  methods: {
    handleAction(action) {
      // 处理工具栏点击事件
      console.log('执行操作:', action)
    },
  }
};
</script>

<style scoped lang="scss">
.page {
  height: 60vh;
  padding: 10px;
  background: #000;
}
</style>
