<template>
  <div class="page">
    <SplitPane :pane-length-percent.sync="paneLengthPercent" />
  </div>
</template>

<script>
import SplitPane from "./split-pane";
export default {
  components: {
    SplitPane,
  },
  data() {
    return {
      paneLengthPercent: 30,
    };
  },
};
</script>

<style scoped lang="scss">
.page {
  height: 60vh;
  padding: 10px;
  background: #000;
}
</style>
