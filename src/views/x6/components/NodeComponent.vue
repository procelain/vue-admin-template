<template>
  <div class="node" v-if="nodeData">
    <div class="index">{{ nodeData.index }}</div>
    <div class="name">{{ nodeData.name }}</div>
  </div>
</template>

<script>
export default {
  name: "NodeComponent",
  inject: ['getGraph', 'getNode'],
  mounted() {
    const node = this.getNode()
    this.nodeData = node.getData()
    console.log('======',this.nodeData)
  },
  data() {
    return {
      nodeData: null
    }
  }
};
</script>

<style>
.node {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid #000;
  background: #f9f9f9;
  width: 100%;
  height: 100%;
}

.index {
  font-weight: bold;
}

.name {
  font-size: 12px;
}
</style>
