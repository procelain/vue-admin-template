<template>
  <div class="route-plugin">
    <!-- 工具栏 -->
    <Toolbar @action="handleAction" />

    <!-- 路线图 -->
    <div class="graph-container">
      <div ref="graphContainer"></div>
<!--      <div id="minimapContainer"></div>-->
    </div>
  </div>
</template>

<script>
import { Graph, Shape } from '@antv/x6';
import Toolbar from './Toolbar.vue'
import SnakeLayout from '../layouts/SnakeLayout' // 自定义蛇形布局
import NodeComponent from './NodeComponent.vue'
import { register } from '@antv/x6-vue-shape'
import { Scroller } from '@antv/x6-plugin-scroller' // 引入 Vue Shape 支持
import { Snapline } from '@antv/x6-plugin-snapline'
import { Export } from '@antv/x6-plugin-export';
import { Clipboard } from '@antv/x6-plugin-clipboard';
import { Selection } from '@antv/x6-plugin-selection';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { History } from '@antv/x6-plugin-history';

// 配置节点排列参数
const nodeWidth = 100; // 节点宽度
const nodeHeight = 50; // 节点高度
const maxPerRow = 5; // 每行最大节点数
const gapX = 20; // 横向间距
const gapY = 50; // 纵向间距
export default {
  name: 'RoutePlugin',
  components: { Toolbar },
  data() {
    return {
      graph: null,
      minimapVisible: false,
      loading: false,
      isCtrlPressed: false,
      isConnectingEnabled: false
    }
  },
  methods: {
    handleAction(action) {
      // 根据工具栏触发的操作处理不同逻辑
      if (action === 'addNode') {
        this.batchAddNode()
      } else if (action === 'save') {
        this.saveGraph()
      } else if (action === 'undo') {
        this.graph.undo()
      } else if (action === 'redo') {
        this.graph.redo()
      } else if (action === 'line') {
        console.log('line')
        this.isConnectingEnabled = !this.isConnectingEnabled
      }
    },
    batchAddNode() {
      const totalNodes = 50; // 假设要添加 20 个节点
      for (let i = 0; i < totalNodes; i++) {
        this.addNode(`工艺 ${i + 1}`, i);
        if (i > 0) {
          this.addEdge(`node-${i - 1}`, `node-${i}`);
        }
      }
      let timer = setTimeout(() => {
        this.graph.centerContent()
        clearTimeout(timer)
      })
    },
    addNode(label, index) {
      const row = Math.floor(index / maxPerRow); // 当前行
      const col = index % maxPerRow; // 当前列
      const direction = row % 2 === 0 ? 1 : -1; // 行排列方向（1: 从左到右, -1: 从右到左）

      const actualCol = direction === 1 ? col : maxPerRow - 1 - col; // 实际列索引

      const x = actualCol * (nodeWidth + gapX);
      const y = row * (nodeHeight + gapY);

      const node = this.graph.addNode({
        id: `node-${index}`, // 唯一 ID
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
        shape: 'vue-shape',
        component: 'NodeComponent',
        data: { index: index, name: label },
        attrs: {
          body: {
            fill: '#f0f0f0',
            stroke: '#d9d9d9',
            magnet: true,
          },
        },
      });

      return node;
    },
    // 添加连线的方法
    addEdge(sourceId, targetId) {
      this.graph.addEdge({
        source: { cell: sourceId },
        target: { cell: targetId },

        attrs: {
          line: {
            stroke: '#A2B1C3',
            strokeWidth: 2,
            targetMarker: {
              name: 'block', // 箭头样式
              width: 12,
              height: 8,
            },
          },
        },
      });
    },
    graphEventListener() {
      // 监听撤销
      this.graph.on('history:undo', ({ cmds }) => {
        console.log('1212',cmds)
      })
      // 监听重写
      this.graph.on('history:redo', ({ cmds }) => {
        console.log(cmds)
      })
      // 监听工艺路线加载完成
      // this.graph.on('view:mounted', ({view}) => {
      //   console.log('mounted::完成加载')
      //   this.loading = false
      // })

      // 用于记录是否按下了 Ctrl 键
      // 监听键盘事件
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Control') {
          this.isCtrlPressed = true;
          this.graph.enableRubberband(); // 启用框选功能
          this.graph.disablePanning(); //禁用画布平移

        }
      });

      document.addEventListener('keyup', (e) => {
        if (e.key === 'Control') {
          this.isCtrlPressed = false;
          this.graph.disableRubberband(); // 禁用框选功能
          this.graph.enablePanning()  //启用框选功能

        }
      });

      // 监听鼠标事件（可选，用于进一步增强控制）
      this.graph.on('blank:mousedown', (e) => {
        if (!this.isCtrlPressed) {
          e.preventDefault(); // 如果没有按下 Ctrl，阻止框选默认行为
        }
      });

      this.graph.on('rubberband:start', () => {
        console.log('开始框选');
      });

      this.graph.on('rubberband:select', ({ selected }) => {
        console.log('框选完成，选中的节点:', selected);
      });
    },
    saveGraph() {
      // 保存图形数据
      const data = this.graph.toJSON()
      console.log('Graph Data:', data)
    },
    initGraph() {
      let pageWidth = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
      )
      let pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
      )
      const container = this.$refs.graphContainer // 获取容器 DOM
      this.graph = new Graph({
        container: container,
        autoResize: true,
        grid: false,
        async: true, // 开启异步渲染
        virtual: true, // 开启虚拟渲染
        // interacting: {
        //   magnetConnectable: this.isConnectingEnabled
        // },
        selecting: {
          enabled: true,
          global: true,
          rubberband: true, // 开启框选模式，但由我们手动控制触发条件
          modifiers: 'ctrl', // 配合快捷键
        },

        mousewheel: {
          enabled: true,
          zoomAtMousePosition: true,
          modifiers: 'ctrl',
        },
        connecting: {
          enabled: false,
          snap: {
            radius: 50,
          },
          allowMulti: false,
          anchor: 'midSide',
          allowBlank: false,
          allowLoop: false,
        },
        keyboard: {
          enabled: true,
        },
        clipboard: {
          enabled: true
        },
        background: {
          color: '#F2F7FA'
        },
        scroller: {
          enabled: true,
          pageVisible: true,
          pageBreak: true,
          pannable: true,
          autoResize: true,
        }
      })
      this.graph.use(
        new Scroller({
          enabled: true,
          pageVisible: true,
          pageBreak: true,
          pannable: true,
          autoResize: true,
          autoResizeOptions: {
            border: Math.max(pageHeight, pageWidth)
          }
        })
      )
      this.graph.use(
        new History({
          enabled: true,
        }),
      )
      this.graph.use(
        new Snapline({
          enabled: true
        })
      )
      this.graph.use(new Export())
      this.graph.use(
        new Clipboard({
          enabled: true,
          useLocalStorage: false
        })
      )
      this.graph.use(
        new Selection({
          enabled: true,
          multiple: true,
          rubberband: false,
          movable: true,
          showNodeSelectionBox: true,
          showEdgeSelectionBox: true,
          pointerEvents: 'none'
        })
      )
      this.graph.use(
        new Keyboard({
          enabled: true,
          global: true
        })
      )
      // 注册 Vue 节点
      register({
        shape: 'vue-shape',
        component: NodeComponent
      })

      // 使用蛇形布局
      // const nodes = this.getInitialNodes() // 获取初始节点数据
      // const edges = this.getInitialEdges() // 获取初始连线数据
      // SnakeLayout(this.graph, nodes) // 调用蛇形布局
      // this.graph.fromJSON({ nodes, edges })
    },


    setGraphSize() {
      let winWidth = document.body.clientWidth || document.documentElement.clientWidth
      let winHeight = document.body.clientHeight || document.documentElement.clientHeight
      let x6GraphScroller = Array.from(document.getElementsByClassName('x6-graph-scroller'))
      x6GraphScroller.forEach(dom => {
        dom.style['width'] = winWidth - 220 + 'px'
        dom.style['height'] = winHeight - 100 + 'px'
      })
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
  created() {
    this.start = performance.now();
  },
  mounted() {
    this.initGraph()
    this.graphEventListener()
    window.onresize = () => {
      this.setGraphSize()
    }
    this.batchAddNode()
    this.end = performance.now();
    console.log("操作执行时间：", this.end - this.start, "毫秒");
  },
  beforeDestroy() {
    if (this.graph) {
      this.graph.off()
      this.graph.dispose()
    }
    window.onresize = null
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
