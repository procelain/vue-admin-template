<template>
  <div class="page">
    <SplitPane :pane-length-percent.sync="paneLengthPercent">
      <template slot="one">
        <a-list item-layout="horizontal" :data-source="configList">
          <a-list-item slot="renderItem" slot-scope="item, index">
            <div class="name">{{ item.name }}</div>
            <div class="desc">{{ item.desc }}</div>
          </a-list-item>
        </a-list>
      </template>
      <template slot="two">

      </template>
    </SplitPane>
  </div>
</template>

<script>
import SplitPane from "../split/split-pane";
export default {
  components: {
    SplitPane,
  },
  data() {
    return {
      paneLengthPercent: 25,
      configList: [
        {
          name: 'panning',
          desc: '拖拽画布'
        },
        {
          name: 'mousewheel',
          desc: '缩放画布'
        },
        {
          name: 'snap',
          desc: '自动吸附'
        },
        {
          name: 'x6-plugin-transform',
          desc: '修改节点尺寸插件'
        },
        {
          name: 'x6-plugin-snapline',
          desc: '对齐线插件'
        },
        {
          name: 'x6-plugin-clipboard',
          desc: '复制粘贴节点插件'
        },
        {
          name: 'x6-plugin-keyboard',
          desc: '快捷键插件'
        },
        {
          name: 'x6-plugin-history',
          desc: '撤销重做'
        },
        {
          name: 'x6-plugin-selection',
          desc: '框选'
        },
        {
          name: 'x6-plugin-scroller',
          desc: '滚动画布'
        },
        {
          name: 'x6-plugin-minimap',
          desc: '小地图'
        },
        {
          name: 'x6-plugin-dnd',
          desc: '流程图组件库拖拽'
        },
        {
          name: 'x6-plugin-stencil',
          desc: '增强dnd能力'
        },
        {
          name: 'x6-plugin-export',
          desc: '导出'
        }
      ]
    };
  },
};
</script>

<style scoped lang="scss">
.page {
  height: 92vh;
  padding: 2px;
  background: #8157035d;
}

::v-deep .ant-list {
  padding: 10px;
}
</style>
