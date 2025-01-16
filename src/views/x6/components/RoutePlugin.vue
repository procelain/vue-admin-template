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
import {
  Graph,
  Shape,
  Path,
  Point,
  EdgeView,
  Registry,
  Model,
  Node,
  Edge,
  Cell,
  Vector
} from '@antv/x6'
import Toolbar from './Toolbar.vue'
import SnakeLayout from '../layouts/SnakeLayout' // 自定义蛇形布局
import NodeComponent from './NodeComponent.vue'
import { register } from '@antv/x6-vue-shape'
import { Scroller } from '@antv/x6-plugin-scroller' // 引入 Vue Shape 支持
import { Snapline } from '@antv/x6-plugin-snapline'
import { Export } from '@antv/x6-plugin-export'
import { Clipboard } from '@antv/x6-plugin-clipboard'
import { Selection } from '@antv/x6-plugin-selection'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { History } from '@antv/x6-plugin-history'
import { DagreLayout } from '@antv/layout'

// 配置节点排列参数
const nodeWidth = 100 // 节点宽度
const nodeHeight = 50 // 节点高度
const maxPerRow = 5 // 每行最大节点数
const gapX = 20 // 横向间距
const gapY = 50 // 纵向间距
export default {
  name: 'RoutePlugin',
  components: { Toolbar },
  data() {
    return {
      graph: null,
      minimapVisible: false,
      loading: false,
      isCtrlPressed: false,
      nodes: [],
      edges: [],
      COLUMN_NUMBER: 3, // 每行最多放置的节点数
      CELL_WIDTH: 200, // 网格单元格宽度
      CELL_HEIGHT: 100, // 网格单元格高度
      COMPONENT_TEXT_HEIGHT: 20, // 组件文本高度
      LINE_LIGHT_COLOR: 'cccccc', // 禁用状态的边颜色
      begin: [0, 0], // 网格起始坐标
      longEdges: [] // 长边数据
    }
  },
  methods: {
    // 应用网格布局
    applyGridLayout() {
      let queue = this.graph.getRootNodes()
      let rowNumber = 0 // 行号
      let columnNumber = 0 // 列号
      let direction = -1 // 方向: 1，向右；-1，向左
      let preYComps = 0 // 上一行的累计高度
      const visited = {} // 记录已访问的节点
      const SWAP_GRID_WIDTH =
        this.begin[0] +
        this.begin[0] +
        this.CELL_WIDTH * (this.COLUMN_NUMBER - 1) // 网格宽度
      let maxCompHeight = 0 // 当前行的最大组件高度

      do {
        if (columnNumber % this.COLUMN_NUMBER === 0) {
          // 每行节点数达到 COLUMN_NUMBER 时，换行并调整方向
          rowNumber++
          columnNumber = 0
          direction *= -1 // 方向反转
          preYComps += maxCompHeight // 更新累计高度
          maxCompHeight = 0 // 重置当前行的最大高度
        }
        columnNumber++

        const cells = [] // 存储下一批待处理的节点
        queue.forEach((next) => {
          if (next == null || visited[next.id]) {
            return // 跳过已访问的节点
          }
          visited[next.id] = true // 标记为已访问

          // 计算节点的高度
          const compHeight =
            next.getData().components?.length *
              (this.COMPONENT_TEXT_HEIGHT - 12) || 0
          maxCompHeight =
            compHeight > maxCompHeight ? compHeight : maxCompHeight

          // 计算节点的水平偏移量
          const { x } = next.getPosition()
          let dx = -((rowNumber - 1) * (this.CELL_WIDTH * this.COLUMN_NUMBER))
          if (direction === -1) {
            // 如果方向为向左，调整水平偏移量
            const targetX = SWAP_GRID_WIDTH - (dx + x)
            dx = targetX - x
          }

          // 计算节点的垂直偏移量
          const dy = (rowNumber - 1) * this.CELL_HEIGHT + preYComps
          next.translate(dx, dy) // 移动节点到新位置

          // 获取当前节点的邻居节点，并按垂直位置排序
          const neighbors = this.graph.getNeighbors(next, { outgoing: true })
          neighbors.sort((a, b) => {
            const { y: aY } = a.position()
            const { y: bY } = b.position()
            return aY - bY
          })

          // 将邻居节点加入待处理队列
          const lastIndex = cells.length
          neighbors.forEach((neighbor) => {
            cells.splice(lastIndex, 0, neighbor)
          })

          // 每行结束时，设置边的连接器样式
          if (columnNumber % this.COLUMN_NUMBER === 0) {
            this.graph.getOutgoingEdges(next)?.forEach((edge) => {
              edge.setConnector('custom', {
                direction: direction === -1 ? 'left' : 'right'
              })
            })
          }

          // 处理状态为 disabled 的节点及其边
          if (next.getData().status === 'disabled') {
            next.attr('body/stroke', `#${this.LINE_LIGHT_COLOR}`)
            const edges = [
              ...(this.graph.getOutgoingEdges(next) || []),
              ...(this.graph.getIncomingEdges(next) || [])
            ]
            edges.forEach((edge) => {
              edge.attr('line/stroke', `#${this.LINE_LIGHT_COLOR}`)
            })
          }
        })
        queue = cells // 更新待处理队列
      } while (queue.length > 0) // 直到所有节点处理完毕

      // 处理长边
      this.longEdges?.forEach((longEdge) => {
        this.graph.addEdge({
          ...longEdge,
          router: { name: 'custom' } // 使用自定义路由器
        })
      })

      // this.graph.unfreeze() // 解冻图，允许渲染
    },

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
        this.toogleConnecting()
      }
    },
    // 切换是否可连线状态
    toogleConnecting() {
      const nodes = this.graph.getNodes()
      const currentMagnet = nodes[0].attr('body/magnet')
      nodes.forEach((node) => {
        node.setAttrs({
          body: {
            fill: '#f0f0f0',
            stroke: '#d9d9d9',
            magnet: !currentMagnet
          }
        })
      })
    },
    // 注册自定义连接器
    registerCustomConnector() {
      const customConnector = (sourcePoint, targetPoint, routePoints, args) => {
        let path
        if (args.direction === 'right') {
          const prev = Point.create(sourcePoint.x + 26, sourcePoint.y - 26)
          path = new Path(Path.createSegment('M', prev))
          path.arcTo(12, 12, 0, 1, 1, targetPoint.x + 26, targetPoint.y + 26)
        } else {
          const prev = Point.create(sourcePoint.x - 26, sourcePoint.y - 26)
          path = new Path(Path.createSegment('M', prev))
          path.arcTo(12, 12, 0, 0, 0, targetPoint.x - 26, targetPoint.y + 26)
        }
        return path.serialize()
      }

      Graph.registerConnector('custom', customConnector)
    },

    // 注册自定义路由器
    registerCustomRouter() {
      const customRouter = (vertices, args, view) => {
        const sourceCorner = view.sourceBBox.getCenter()
        const targetCorner = view.targetBBox.getCenter()
        const points = vertices.map((p) => Point.create(p))
        const middleY = (sourceCorner.y + targetCorner.y) / 2
        points.push(Point.create(sourceCorner.x, middleY))
        points.push(Point.create(targetCorner.x, middleY))

        const manhattan = Registry.Router.presets['manhattan']
        const routerArgs = args
        return manhattan.call(this, points, routerArgs, view)
      }

      Graph.registerRouter('custom', customRouter)
    },
    // 新增节点
    batchAddNode() {
      const totalNodes = 50 // 假设要添加 20 个节点
      for (let i = 0; i < totalNodes; i++) {
        this.nodes.push(this.addNode(`工艺 ${i + 1}`, i))
        if (i > 0) {
          this.edges.push(this.addEdge(`node-${i - 1}`, `node-${i}`))
        }
      }

      // 创建 Dagre 布局实例
      const dagreLayout = new DagreLayout({
        type: 'dagre', // 指定布局类型为 dagre
        rankdir: 'LR', // 布局方向，TB 表示从上到下，LR 表示从左到右
        align: 'UL', // 节点对齐方式，UL 表示左上对齐
        nodesep: 50, // 节点间距
        ranksep: 100 // 层次间距
      })
      dagreLayout.updateCfg({
        begin: this.begin,
        ranker: 'longest-path' // 'tight-tree' 'longest-path' 'network-simplex'
      })
      const layoutData = dagreLayout.layout({
        nodes: this.nodes,
        edges: this.edges
      })
      // this.graph.freeze()
      this.graph.fromJSON(layoutData)
      this.applyGridLayout()
      let timer = setTimeout(() => {
        this.graph.centerContent()
        clearTimeout(timer)
      })
    },
    addNode(label, index) {
      const row = Math.floor(index / maxPerRow) // 当前行
      const col = index % maxPerRow // 当前列
      const direction = row % 2 === 0 ? 1 : -1 // 行排列方向（1: 从左到右, -1: 从右到左）

      const actualCol = direction === 1 ? col : maxPerRow - 1 - col // 实际列索引

      const x = actualCol * (nodeWidth + gapX)
      const y = row * (nodeHeight + gapY)

      // const node = this.graph.addNode({
      //   id: `node-${index}`, // 唯一 ID
      //   x,
      //   y,
      //   width: nodeWidth,
      //   height: nodeHeight,
      //   shape: 'vue-shape',
      //   component: 'NodeComponent',
      //   data: { index: index, name: label },
      //   attrs: {
      //     body: {
      //       fill: '#f0f0f0',
      //       stroke: '#d9d9d9',
      //       magnet: false
      //     }
      //   }
      // })
      const node = {
        id: `node-${index}`, // 唯一 ID
        width: nodeWidth,
        height: nodeHeight,
        shape: 'vue-shape',
        component: 'NodeComponent',
        data: { index: index, name: label },
        attrs: {
          body: {
            fill: '#f0f0f0',
            stroke: '#d9d9d9',
            magnet: false
          }
        }
      }

      return node
    },
    // 添加连线的方法
    addEdge(sourceId, targetId) {
      // this.graph.addEdge({
      //   source: { cell: sourceId },
      //   target: { cell: targetId },

      //   attrs: {
      //     line: {
      //       stroke: '#A2B1C3',
      //       strokeWidth: 2,
      //       targetMarker: {
      //         name: 'block', // 箭头样式
      //         width: 12,
      //         height: 8
      //       }
      //     }
      //   }
      // })
      const edge = {
        source: { cell: sourceId },
        target: { cell: targetId },

        attrs: {
          line: {
            stroke: '#A2B1C3',
            strokeWidth: 2,
            targetMarker: {
              name: 'block', // 箭头样式
              width: 12,
              height: 8
            }
          }
        }
      }
      return edge
    },
    // 图表事件监听
    graphEventListener() {
      // 监听撤销
      this.graph.on('history:undo', ({ cmds }) => {
        console.log('1212', cmds)
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
          this.isCtrlPressed = true
          this.graph.enableRubberband() // 启用框选功能
          this.graph.disablePanning() //禁用画布平移
        }
      })

      document.addEventListener('keyup', (e) => {
        if (e.key === 'Control') {
          this.isCtrlPressed = false
          this.graph.disableRubberband() // 禁用框选功能
          this.graph.enablePanning() //启用框选功能
        }
      })

      // 监听鼠标事件（可选，用于进一步增强控制）
      this.graph.on('blank:mousedown', (e) => {
        if (!this.isCtrlPressed) {
          e.preventDefault() // 如果没有按下 Ctrl，阻止框选默认行为
        }
      })

      this.graph.on('rubberband:start', () => {
        console.log('开始框选')
      })

      this.graph.on('rubberband:select', ({ selected }) => {
        console.log('框选完成，选中的节点:', selected)
      })
    },
    saveGraph() {
      // 保存图形数据
      const data = this.graph.toJSON()
      console.log('Graph Data:', data)
    },
    // 初始化x6
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
        selecting: {
          enabled: true,
          global: true,
          rubberband: true, // 开启框选模式，但由我们手动控制触发条件
          modifiers: 'ctrl' // 配合快捷键
        },

        mousewheel: {
          enabled: true,
          zoomAtMousePosition: true,
          modifiers: 'ctrl'
        },
        connecting: {
          enabled: false,
          snap: {
            radius: 50
          },
          allowMulti: false,
          anchor: 'midSide',
          allowBlank: false,
          allowLoop: false
        },
        keyboard: {
          enabled: true
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
          autoResize: true
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
      // 撤销重写
      this.graph.use(
        new History({
          enabled: true
        })
      )
      // 对齐线
      this.graph.use(
        new Snapline({
          enabled: true
        })
      )
      // 导出
      this.graph.use(new Export())
      // 剪切板
      this.graph.use(
        new Clipboard({
          enabled: true,
          useLocalStorage: false
        })
      )
      // 选中
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
      // 键盘
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
      this.registerCustomConnector()
      this.registerCustomRouter()
      // 使用蛇形布局
      // const nodes = this.getInitialNodes() // 获取初始节点数据
      // const edges = this.getInitialEdges() // 获取初始连线数据
      // SnakeLayout(this.graph, nodes) // 调用蛇形布局
      // this.graph.fromJSON({ nodes, edges })
    },

    setGraphSize() {
      let winWidth =
        document.body.clientWidth || document.documentElement.clientWidth
      let winHeight =
        document.body.clientHeight || document.documentElement.clientHeight
      let x6GraphScroller = Array.from(
        document.getElementsByClassName('x6-graph-scroller')
      )
      x6GraphScroller.forEach((dom) => {
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
    this.start = performance.now()
  },
  mounted() {
    this.initGraph()
    this.graphEventListener()
    window.onresize = () => {
      this.setGraphSize()
    }
    this.batchAddNode()
    this.end = performance.now()
    console.log('操作执行时间：', this.end - this.start, '毫秒')
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
