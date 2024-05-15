<template>
  <div class="father-view">
    <h3>父组件</h3>
    <div class="flex-view">
      <span>name：</span>
      <el-input v-model="nameInput" class="name-input" />
      <el-input v-model="params[0].option" class="name-input" />
      <el-input v-model="params[1].option" class="name-input" />
    </div>
    <div v-for="item in params">
      <Child v-model="item.option" />
    </div>
  </div>
</template>

<script>
import Child from "./Child.vue";
export default {
  components: { Child },
  data() {
    return {
      nameInput: "",
      params: [{ option: "" }, { option: "" }],
    };
  },
};
</script>

<style lang="scss">
.father-view {
  border: 1px solid green;
  padding: 20px;
  .flex-view {
    display: flex;
    justify-content: flex-start;
    span {
      width: 100px;
    }
  }
  .name-input {
    margin-bottom: 20px;
  }
}
</style>
