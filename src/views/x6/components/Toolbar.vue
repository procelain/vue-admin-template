<template>
  <div class="toolbar">
    <button @click="$emit('action', 'addNode')">添加节点</button>
    <button @click="$emit('action', 'save')">保存</button>
    <button @click="$emit('action', 'undo')">撤销</button>
    <button @click="$emit('action', 'redo')">重做</button>
    <button @click="$emit('action', 'line')">连线</button>
  </div>
</template>

<script>
export default {
  name: "Toolbar",
};
</script>

<style>
.toolbar {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
}
</style>
