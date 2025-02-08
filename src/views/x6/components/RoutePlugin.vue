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
  Vector, DataUri
} from '@antv/x6';
import Toolbar from './Toolbar.vue';
import SnakeLayout from '../layouts/SnakeLayout'; // 自定义蛇形布局
import NodeComponent from './NodeComponent.vue';
import { register } from '@antv/x6-vue-shape';
import { Scroller } from '@antv/x6-plugin-scroller'; // 引入 Vue Shape 支持
import { Snapline } from '@antv/x6-plugin-snapline';
import { Export } from '@antv/x6-plugin-export';
import { Clipboard } from '@antv/x6-plugin-clipboard';
import { Selection } from '@antv/x6-plugin-selection';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { History } from '@antv/x6-plugin-history';
import { DagreLayout } from '@antv/layout';

// 配置节点排列参数
const LAYOUT_CONFIG = {
  nodeWidth: 120,
  nodeHeight: 60,
  gapX: 80,  // 节点水平间距
  gapY: 100,   // 节点垂直间距
  maxPerRow: 5        // 每行最大节点数
};

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
      COLUMN_NUMBER: 5, // 每行最多放置的节点数
      CELL_WIDTH: 100, // 网格单元格宽度
      CELL_HEIGHT: 50, // 网格单元格高度
      LINE_LIGHT_COLOR: '', // 禁用状态的边颜色
      begin: [50, 50], // 网格起始坐标
      longEdges: [], // 长边数据
      nodeMap: new Map()
    };
  },
  methods: {
    /**
     * 根据节点数组和起始节点 id，构造层级数组，每个子数组为一层节点 id 的集合
     * @param {Array} nodes - 节点数组，每个节点包含 id 和 targets 字段
     * @param {string} startId - 起始节点 id
     * @returns {Array} 层级数组，例如：[[1], [2,3,4,5], [6,7], ...]
     */
    groupNodesByLevel(nodes, startId) {
      const levels = [];     // 最终结果：二维数组
      const visited = new Set(); // 用于记录已访问的节点 id，防止重复
      let currentLevel = [startId];
      // 标记起始节点已访问
      visited.add(startId);
      while (currentLevel.length > 0) {
        // 将当前层加入结果
        levels.push(currentLevel);
        const nextLevel = [];
        // 遍历当前层的每个节点
        currentLevel.forEach((nodeId) => {
          const node = this.nodeMap.get(nodeId);
          if (node && Array.isArray(node.targets)) {
            node.targets.forEach((targetId) => {
              // 如果该 target 节点尚未被访问，则加入下一层并标记访问
              if (!visited.has(targetId)) {
                visited.add(targetId);
                nextLevel.push(targetId);
              }
            });
          }
        });
        // 更新当前层为下一层
        currentLevel = nextLevel;
      }
      return levels;
    },
    /** 测试数据 Mock data */
    getMockData(prefer) {
      switch (prefer) {
        case 'A':
          return [
            {
              id: '1', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['2', '3', '4', '5'] // 旅程节点 下一个节点
            },
            {
              id: '2', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['6'], // 旅程节点 下一个节点
              components: ['应用组件'] // 旅程节点 应用组件
            },
            {
              id: '3', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['6', '7'], // 旅程节点 下一个节点
              status: 'disabled' // 旅程节点 状态
            },
            {
              id: '4', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['6'], // 旅程节点 下一个节点
              status: 'disabled' // 旅程节点 状态
            },
            {
              id: '5', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['6'], // 旅程节点 下一个节点
              status: 'disabled' // 旅程节点 状态
            },
            {
              id: '6', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['8'], // 旅程节点 下一个节点
              status: 'disabled' // 旅程节点 状态
            },
            {
              id: '7', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['6'] // 旅程节点 下一个节点
            },
            {
              id: '8', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['9'] // 旅程节点 下一个节点
            },
            {
              id: '9', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['10'] // 旅程节点 下一个节点
            },
            {
              id: '10', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['11'] // 旅程节点 下一个节点
            },
            {
              id: '11', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: [] // 旅程节点 下一个节点
            }
          ];
        case 'B':
          return [
            {
              id: '1', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['2', '3'] // 旅程节点 下一个节点
            },
            {
              id: '2', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['4'], // 旅程节点 下一个节点
              status: 'disabled' // 旅程节点 状态
            },
            {
              id: '3', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['4'] // 旅程节点 下一个节点
            },
            {
              id: '4', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['5'] // 旅程节点 下一个节点
            },
            {
              id: '5', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['6'] // 旅程节点 下一个节点
            },
            {
              id: '6', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['7'] // 旅程节点 下一个节点
            },
            {
              id: '7', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['8'] // 旅程节点 下一个节点
            },
            {
              id: '8', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['9'] // 旅程节点 下一个节点
            },
            {
              id: '9', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['10'] // 旅程节点 下一个节点
            },
            {
              id: '10', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['11'] // 旅程节点 下一个节点
            },
            {
              id: '11', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['12'] // 旅程节点 下一个节点
            },
            {
              id: '12', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['13'] // 旅程节点 下一个节点
            },
            {
              id: '13', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['14'], // 旅程节点 下一个节点
              status: 'warning' // 旅程节点 状态
            },
            {
              id: '14', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['15'] // 旅程节点 下一个节点
            },
            {
              id: '15', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['16'] // 旅程节点 下一个节点
            },
            {
              id: '16', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['17'], // 旅程节点 下一个节点
              status: 'disabled' // 旅程节点 状态
            },
            {
              id: '17', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['18'], // 旅程节点 下一个节点
              status: 'disabled' // 旅程节点 状态
            },
            {
              id: '18', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: [], // 旅程节点 下一个节点
              status: 'disabled' // 旅程节点 状态
            }
          ];
        case 'C':
        default:
          return [
            {
              id: '1', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['2'] // 旅程节点 下一个节点
            },
            {
              id: '2', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['3'] // 旅程节点 下一个节点
            },
            {
              id: '3', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['4'] // 旅程节点 下一个节点
            },
            {
              id: '4', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: ['5'], // 旅程节点 下一个节点
              status: 'warning' // 旅程节点 状态
            },
            {
              id: '5', // 旅程节点 ID
              title: '旅程节点', // 旅程节点 名称
              targets: [] // 旅程节点 下一个节点
            }
          ];
      }
    },
    // 构建图数据
    buildGraphData(nodesData) {
      const nodes = [];
      const edges = [];
      this.nodeMap.clear();
      nodesData.forEach(node => {
        const graphNode = {
          id: node.id,
          shape: 'vue-shape',
          width: LAYOUT_CONFIG.nodeWidth,
          height: LAYOUT_CONFIG.nodeHeight,
          component: 'NodeComponent',
          targets: node.targets,
          data: node,
          zIndex: 1,
          attrs: {
            body: {
              fill: '#f0f0f0',
              stroke: '#d9d9d9',
              magnet: false
            }
          }
        };
        nodes.push(graphNode);
        this.nodeMap.set(node.id, graphNode);

        node.targets?.forEach(targetId => {
          edges.push({
            source: node.id,
            target: targetId,
            router: {
              name: 'manhattan',
              args: {
                startDirections: ['right', 'bottom'],
                endDirections: ['left', 'bottom']
              }
            },
            connector: {
              name: 'rounded',
              args: {
                radius: 20
              }
            },
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8
                }
              }
            }
          });
        });
      });
      return { nodes, edges };
    },
    calculateSPositions(layers) {
      let currentY = 0; // 当前列起始Y坐标
      let maxRowHeight = 0; // 当前列的最大高度
      console.log('layer', layers)
      layers.forEach((column, colIndex) => {
        // 根据colIndex判断换行
        const row = Math.floor(colIndex / LAYOUT_CONFIG.maxPerRow)
        // 获取当前行最大高度

        let rowY = row * (LAYOUT_CONFIG.nodeHeight + LAYOUT_CONFIG.gapY);
        column.forEach((nodeId, rowIndex) => {
          // 根据rowIndex判断行偏移量
          const node = this.nodeMap.get(nodeId);
          node.x = colIndex * (LAYOUT_CONFIG.nodeWidth + LAYOUT_CONFIG.gapX)
          node.y = rowY
          rowY += LAYOUT_CONFIG.nodeHeight + LAYOUT_CONFIG.gapY; // 更新下一个节点的 Y 坐标
        });
        // 记录当前列的最大行数，作为下一列的起始位置
        maxRowHeight = Math.max(maxRowHeight, rowY);
        currentY = maxRowHeight;
      });
    },
    // 应用网格布局
    layout(graphNodes) {
      const begin = [60, 90];
      const { nodes, edges } = this.buildGraphData(graphNodes);
      // 找到所有根节点
      const rootNodes = graphNodes.filter(node =>
        !graphNodes.some(n => n.targets?.includes(node.id))
      );
      if (rootNodes && rootNodes.length) {
        const startId = rootNodes[0].id
        const levels = this.groupNodesByLevel(nodes, startId);
        this.calculateSPositions(levels)
        console.log('9999999999', levels,nodes);
      }
      // 创建 Dagre 布局实例
      // const dagreLayout = new DagreLayout({
      //   type: 'dagre', // 指定布局类型为 dagre
      //   rankdir: 'LR', // 布局方向，TB 表示从上到下，LR 表示从左到右
      //   align: 'UL', // 节点对齐方式，UL 表示左上对齐
      //   nodesepFunc: () => {
      //     return 20;
      //   },
      //   ranksepFunc: () => {
      //     return 50;
      //   }
      // });

      // const layoutData = dagreLayout.layout({
      //   nodes: nodes,
      //   edges: edges
      // });
      // const adjustedData = {
      //   ...layoutData,
      //   nodes: layoutData.nodes.map((node) => {
      //     // 通过逻辑调整每个节点的位置
      //     if (node.targets && node.targets.length) {
      //       console.log('33333',node)
      //       node.y = node.y + node.targets.length * 20
      //     }
      //     return node;
      //   }),
      // };
      // const COLUMN_NUMBER = 6; // 例如每行 3 个节点
      // const groupedNodes = [];
      // layoutData.nodes.forEach((node, index) => {
      //   const rowIndex = Math.floor(index / COLUMN_NUMBER); // 计算行号
      //   if (!groupedNodes[rowIndex]) {
      //     groupedNodes[rowIndex] = [];
      //   }
      //   groupedNodes[rowIndex].push(node);
      // });
      // groupedNodes.forEach((nodesInRow, rowIndex) => {
      //   const isReverse = rowIndex % 2 === 1; // 奇数行反向排列

      // if (isReverse) {
      //   nodesInRow.reverse(); // 反转节点顺序
      // }

      //   // 重新计算节点的 x 和 y 坐标
      //   nodesInRow.forEach((node, colIndex) => {
      //     node.x = colIndex * 100 + 50*colIndex; // 假设每个节点宽度为 100
      //     node.y = rowIndex * 100; // 假设每行高度为 100
      //   });
      // });
      this.graph.fromJSON({ nodes });
    },

    handleAction(action) {
      // 根据工具栏触发的操作处理不同逻辑
      if (action === 'addNode') {
        this.batchAddNode();
      } else if (action === 'save') {
        this.saveGraph();
      } else if (action === 'undo') {
        this.graph.undo();
      } else if (action === 'redo') {
        this.graph.redo();
      } else if (action === 'line') {
        this.toogleConnecting();
      } else if (action === 'export') {
        this.exportImg();
      }
    },
    exportImg() {
      let title = 'graph';
      let timer = setTimeout(() => {
        this.graph.toPNG(
          dataUri => {
            DataUri.downloadDataUri(dataUri, title);
          },
          {
            padding: {
              top: 50,
              left: 50,
              right: 50,
              bottom: 50
            },
            quality: 1,
            stylesheet: `
              .x6-node-vue {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                border: 1px solid #000;
                background: red;
                width: 100px;
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
              }`
          }
        );
        clearTimeout(timer);
      }, 10);
    },
    // 切换是否可连线状态
    toogleConnecting() {
      const nodes = this.graph.getNodes();
      const currentMagnet = nodes[0].attr('body/magnet');
      nodes.forEach((node) => {
        node.setAttrs({
          body: {
            fill: '#f0f0f0',
            stroke: '#d9d9d9',
            magnet: !currentMagnet
          }
        });
      });
    },
    // 注册自定义连接器
    registerCustomConnector() {
      const customConnector = (sourcePoint, targetPoint, routePoints, args) => {
        let path;
        if (args.direction === 'right') {
          const prev = Point.create(sourcePoint.x + 26, sourcePoint.y - 26);
          path = new Path(Path.createSegment('M', prev));
          path.arcTo(12, 12, 0, 1, 1, targetPoint.x + 26, targetPoint.y + 26);
        } else {
          const prev = Point.create(sourcePoint.x - 26, sourcePoint.y - 26);
          path = new Path(Path.createSegment('M', prev));
          path.arcTo(12, 12, 0, 0, 0, targetPoint.x - 26, targetPoint.y + 26);
        }
        return path.serialize();
      };

      Graph.registerConnector('custom', customConnector);
    },

    // 注册自定义路由器
    registerCustomRouter() {
      const customRouter = (vertices, args, view) => {
        const sourceCorner = view.sourceBBox.getCenter();
        const targetCorner = view.targetBBox.getCenter();
        const points = vertices.map((p) => Point.create(p));
        const middleY = (sourceCorner.y + targetCorner.y) / 2;
        points.push(Point.create(sourceCorner.x, middleY));
        points.push(Point.create(targetCorner.x, middleY));

        const manhattan = Registry.Router.presets['manhattan'];
        const routerArgs = args;
        return manhattan.call(this, points, routerArgs, view);
      };

      Graph.registerRouter('custom', customRouter);
    },
    // 新增节点
    batchAddNode() {
      const totalNodes = 30; // 假设要添加 20 个节点
      for (let i = 0; i < totalNodes; i++) {
        this.nodes.push(this.addNode(`工艺 ${i + 1}`, i));
        if (i > 0) {
          this.edges.push(this.addEdge(`node-${i - 1}`, `node-${i}`));
        }
      }

      let timer = setTimeout(() => {
        this.graph.centerContent();
        clearTimeout(timer);
      });
    },
    addNode(label, index) {
      const node = {
        id: `node-${index}`, // 唯一 ID
        width: LAYOUT_CONFIG.nodeWidth,
        height: LAYOUT_CONFIG.nodeHeight,
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
      };

      return node;
    },
    // 添加连线的方法
    addEdge(sourceId, targetId) {
      const edge = {
        source: { cell: sourceId },
        target: { cell: targetId },
        router: {
          name: 'manhattan',
          padding: 30
        },
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
      };
      return edge;
    },
    // 图表事件监听
    graphEventListener() {
      // 监听撤销
      this.graph.on('history:undo', ({ cmds }) => {
        console.log('1212', cmds);
      });
      // 监听重写
      this.graph.on('history:redo', ({ cmds }) => {
        console.log(cmds);
      });
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
          this.graph.enablePanning(); //启用框选功能
        }
      });

      // 监听鼠标事件（可选，用于进一步增强控制）
      this.graph.on('blank:mousedown', (e) => {
        if (!this.isCtrlPressed) {
          e.preventDefault && e.preventDefault(); // 如果没有按下 Ctrl，阻止框选默认行为
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
      const data = this.graph.toJSON();
      console.log('Graph Data:', data);
    },
    // 初始化x6
    initGraph() {
      let pageWidth = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
      );
      let pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
      );
      const container = this.$refs.graphContainer; // 获取容器 DOM
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
      });
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
      );
      // 撤销重写
      this.graph.use(
        new History({
          enabled: true
        })
      );
      // 对齐线
      this.graph.use(
        new Snapline({
          enabled: true
        })
      );
      // 导出
      this.graph.use(new Export());
      // 剪切板
      this.graph.use(
        new Clipboard({
          enabled: true,
          useLocalStorage: false
        })
      );
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
      );
      // 键盘
      this.graph.use(
        new Keyboard({
          enabled: true,
          global: true
        })
      );
      console.log('555555555', this.graph);
      // 注册 Vue 节点
      register({
        shape: 'vue-shape',
        component: NodeComponent
      });
      this.registerCustomConnector();
      this.registerCustomRouter();
    },

    setGraphSize() {
      let winWidth =
        document.body.clientWidth || document.documentElement.clientWidth;
      let winHeight =
        document.body.clientHeight || document.documentElement.clientHeight;
      let x6GraphScroller = Array.from(
        document.getElementsByClassName('x6-graph-scroller')
      );
      x6GraphScroller.forEach((dom) => {
        dom.style['width'] = winWidth - 220 + 'px';
        dom.style['height'] = winHeight - 100 + 'px';
      });
    }

  },
  created() {
    this.start = performance.now();
  },
  mounted() {
    this.initGraph();
    this.graphEventListener();
    window.onresize = () => {
      this.setGraphSize();
    };
    // this.batchAddNode()
    const graphData = this.getMockData('A');
    this.layout(graphData);
    let timer = setTimeout(() => {
      this.graph.centerContent();
      clearTimeout(timer);
    });
    this.end = performance.now();
    console.log('操作执行时间：', this.end - this.start, '毫秒');
  },
  beforeDestroy() {
    if (this.graph) {
      this.graph.off();
      this.graph.dispose();
    }
    window.onresize = null;
  }
};
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
