<template>
  <div class="child-view">
    <h3>子组件</h3>
    <p v-show="false">父组件传递给子组件的参数： {{ value }}</p>

    <!-- <el-input type="text" v-model="myName" /> -->
  </div>
</template>

<script>
export default {
  props: ["value"],

  data() {
    return {
      myName: "",
      myAge: "",
      searchValue: "",
    };
  },
  mounted() {
    console.log("子组件mounted了");
  },
  watch: {},

  updated() {
    console.log("子组件updated生命周期数据变化");
  },
};
</script>

<style lang="scss">
.child-view {
  margin-top: 150px;
  padding: 20px;
  border: 1px solid red;
}
</style>
