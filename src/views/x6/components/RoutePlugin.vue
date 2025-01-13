<template>
  <div class="route-plugin">
    <!-- 工具栏 -->
    <Toolbar @action="handleAction" />

    <!-- 路线图 -->
    <div class="graph-container">
      <div ref="graphContainer"></div>
    </div>
  </div>
</template>

<script>
import { Graph } from '@antv/x6'
import Toolbar from './Toolbar.vue'
import SnakeLayout from '../layouts/SnakeLayout' // 自定义蛇形布局
import NodeComponent from './NodeComponent.vue'
import { register } from '@antv/x6-vue-shape'
import { Scroller } from '@antv/x6-plugin-scroller' // 引入 Vue Shape 支持
import { Snapline } from '@antv/x6-plugin-snapline'

export default {
  name: 'RoutePlugin',
  components: { Toolbar },
  data() {
    return {
      graph: null
    }
  },
  methods: {
    handleAction(action) {
      // 根据工具栏触发的操作处理不同逻辑
      if (action === 'addNode') {
        this.addNode()
      } else if (action === 'save') {
        this.saveGraph()
      }
    },
    addNode() {
      // 添加一个新节点
      this.graph.addNode({
        x: Math.random() * 100,
        y: Math.random() * 100,
        width: 100,
        height: 50,
        shape: 'vue-shape',
        component: 'NodeComponent',
        data: { index: '01', name: '节点名称' }
      })
      // this.graph.centerContent()
      this.graph.scroller.zoomToFit()
    },
    saveGraph() {
      // 保存图形数据
      const data = this.graph.toJSON()
      console.log('Graph Data:', data)
    },
    initGraph() {
      const container = this.$refs.graphContainer // 获取容器 DOM
      const width = container.parentElement.offsetWidth
      const height = container.parentElement.offsetHeight
      this.graph = new Graph({
        container: container,
        autoResize: true,
        grid: false,
        async: true, // 开启异步渲染
        virtual: true, // 开启虚拟渲染
        background: {
          color: '#F2F7FA'
        },
        width,
        height
      })
      this.graph.use(
        new Scroller({
          enabled: true,
          pageVisible: true,
          pageBreak: true,
          pannable: true,
          autoResize: true
        })
      )
      this.graph.use(
        new Snapline({
          enabled: true
        })
      )
      // 注册 Vue 节点
      register({
        shape: 'vue-shape',
        component: NodeComponent
      })

      // 使用蛇形布局
      const nodes = this.getInitialNodes() // 获取初始节点数据
      const edges = this.getInitialEdges() // 获取初始连线数据
      SnakeLayout(this.graph, nodes) // 调用蛇形布局
      this.graph.fromJSON({ nodes, edges })
    },
    updateGraphSize() {
      const container = this.$refs.graphContainer
      const width = container.parentElement.offsetWidth
      const height = container.parentElement.offsetHeight

      this.graph.resize(width, height)
    },
    getInitialNodes() {
      // 示例初始节点数据
      return []
    },
    getInitialEdges() {
      // 示例初始连线数据
      return []
    }
  },
  mounted() {
    this.initGraph()
    // 添加窗口大小监听器，实现自适应
    window.addEventListener('resize', this.updateGraphSize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateGraphSize)
  }
}
</script>

<style>
.route-plugin {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 50px);
}

.graph-container {
  width: 100%;
  height: 100%;
  flex: 1;
  margin-top: 10px;
}
</style>
