export default function SnakeLayout(graph, nodes) {
  const padding = 20; // 间距
  const width = 100; // 节点宽度
  const height = 50; // 节点高度

  let x = 0;
  let y = 0;
  const direction = 1; // 初始方向：1 为右，-1 为左

  nodes.forEach((node, index) => {
    node.x = x;
    node.y = y;

    if ((index + 1) % 4 === 0) {
      // 换行
      y += height + padding;
      x = 0;
    } else {
      x += direction * (width + padding);
    }
  });

  graph.fromJSON({ nodes });
}
