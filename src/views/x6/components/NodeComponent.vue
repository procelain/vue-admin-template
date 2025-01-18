<template>
  <div class="x6-node-vue" v-if="nodeData">
    <div class="x6-node-vue-index">{{ nodeData.id }}</div>
    <div class="x6-node-vue-name">{{ nodeData.title }}</div>
  </div>
</template>

<script>
export default {
  name: "NodeComponent",
  inject: ['getGraph', 'getNode'],
  mounted() {
    const node = this.getNode()
    this.nodeData = node.getData()
  },
  data() {
    return {
      nodeData: null
    }
  }
};
</script>

<style>
.x6-node-vue {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid #000;
  background: #f9f9f9;
  width: 100%;
  height: 100%;
}

.x6-node-vue-index {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  width: 100px;
  height: 25px;
  line-height: 25px;
}

.x6-node-vue-name {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: red;
  width: 100px;
  height: 25px;
}
</style>
