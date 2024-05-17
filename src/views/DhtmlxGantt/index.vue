<template>
  <div class="container" id="main-gantt">
    <div class="tools-list">
      <div class="tool-button">{{ "仅供学习" }} <a
          href="https://gitee.com/lht1132950411/blog/blob/master/examples/Dhtmlx_gantt.zip">资源地址，感谢提供包的大佬</a></div>
      <div class="data-scale">
        <a-select v-model="config.dataScale" style="width: 50px">
          <a-select-option value="Days">
            天
          </a-select-option>
          <a-select-option value="Week">
            周
          </a-select-option>
          <a-select-option value="Months">
            月
          </a-select-option>
          <a-select-option value="Years">
            年
          </a-select-option>
        </a-select>
      </div>
      <a-button title="回退" @click="undo" :loading="undoLoading" class="tool-button">
        <a-icon type="undo" v-if="!undoLoading" />
      </a-button>
      <a-button title="重做" @click="redo" :loading="redoLoading" class="tool-button">
        <a-icon type="redo" v-if="!redoLoading" />
      </a-button>
      <a-button title="删除" @click="del" :loading="delLoading" class="tool-button">
        <a-icon type="delete" v-if="!delLoading" />
      </a-button>
      <a-button-group class="tool-button">
        <a-button title="左移" @click="moveBackward" :loading="moveBackwardLoading"> <a-icon type="left"
            v-if="!moveBackwardLoading" /></a-button>
        <a-button title="右移" @click="moveForward" :loading="moveForwardLoading"> <a-icon type="right"
            v-if="!moveForwardLoading" /> </a-button>
      </a-button-group>
      <a-button title="全屏" @click="fullscreen" class="tool-button">
        <a-icon type="fullscreen" />
      </a-button>
    </div>
    <!-- <a-spin :spinning="spinning">
      <div class="spin-content">
        <GanttComponent ref="gantt" :tasks="tasks" :config="config" @task-updated="taskUpdate"
          @link-updated="linkUpdate" @task-selected="selectTask">
        </GanttComponent>
      </div>
    </a-spin> -->
    <GanttComponent ref="gantt" :tasks="tasks" :config="config" @task-updated="taskUpdate" @link-updated="linkUpdate"
      @task-selected="selectTask">
    </GanttComponent>
  </div>
</template>

<script>
import GanttComponent from "./GanttComponent.vue";
const axios = require('axios');
export default {
  name: "app",
  components: { GanttComponent },
  computed: {
    ganttInstance() {
      return this.$refs.gantt.$refs.ganttContainer.gantt
    }
  },
  data() {
    return {
      value: "",
      tasks: {
        "data": [
          {
            "id": 5,
            "text": "Task #1.1",
            "start_date": "2017-04-07 00:00:00",
            "duration": 7,
            "progress": 0.34,
            "parent": 1,
            "sortorder": 2,
            "open": true
          },
          {
            "id": 2,
            "text": "Task #1",
            "start_date": "2017-04-11 00:00:00",
            "duration": 4,
            "progress": 0.639881,
            "parent": 1,
            "sortorder": 3,
            "open": true
          },
          {
            "id": 1,
            "text": "Project #1",
            "start_date": "2017-04-07 00:00:00",
            "duration": 6,
            "progress": 0.8,
            "parent": 0,
            "sortorder": 7,
            "open": true
          },
          {
            "id": 4,
            "text": "Task #3",
            "start_date": "2017-04-12 00:00:00",
            "duration": 4,
            "progress": 0,
            "parent": 1,
            "sortorder": 7,
            "open": true
          },
          {
            "id": 15,
            "text": "新任无",
            "start_date": "2017-04-11 00:00:00",
            "duration": 1,
            "progress": 0,
            "parent": 0,
            "sortorder": 11,
            "open": true
          },
          {
            "id": 18,
            "text": "新任",
            "start_date": "2017-04-11 00:00:00",
            "duration": 4,
            "progress": 0,
            "parent": 0,
            "sortorder": 22,
            "open": true
          }
        ],
        "collections": {
          "links": [
            {
              "id": 20,
              "source": 15,
              "target": 18,
              "type": "1"
            }
          ]
        }
      },
      selectedTask: null,
      config: {
        dataScale: "Week",
      },
      undoPageData: false,
      spinning: false,
      undoLoading: false,
      redoLoading: false,
      indentLoading: false,
      outdentLoading: false,
      delLoading: false,
      moveBackwardLoading: false,
      moveForwardLoading: false,
      loadingKey: ''
    };
  },

  mounted() {
    // this.loadData()
  },
  methods: {
    loadData() {
      const that = this
      that.spinning = true
      axios.get('api/data')
        .then(function (response) {
          // 处理成功情况
          that.tasks = response.data
          that.ganttInstance.parse(that.tasks)
          that.ganttInstance.refreshData()
        })
        .catch(function (error) {
          // 处理错误情况
          console.log(error);
        })
        .finally(function () {
          // 总是会执行
          that.spinning = false
        });
    },
    reqHandle(mode) {
      let method = ''
      let message = ''
      let errorMessage = ''
      switch (mode) {
        case "update":
          method = 'put'
          message = '更新成功'
          errorMessage = '更新失败'
          break;
        case "create":
          console.log('create')
          method = 'post'
          message = '新增成功'
          errorMessage = '新增失败'
          break;
        case "delete":
          method = 'delete'
          message = '删除成功'
          errorMessage = '删除失败'
          break;
        default:
          break;
      }
      return { method, message, errorMessage }
    },
    // 任务更新
    taskUpdate(id, mode, task) {
      // const that = this
      // that.loadingKey && (that[that.loadingKey + 'Loading'] = true)
      // // 仅回滚页面，则直接返回
      // if (that.undoPageData) {
      //   return
      // }

      // const { method, message, errorMessage } = that.reqHandle(mode)
      // axios[method](`api/data/task/${method != 'post' ? id : ''}`, task)
      //   .then(function (response) {
      //     console.log('then-----------')
      //     if (response.data.action == 'error') {
      //       throw new Error()
      //     }
      //     // 处理成功情况
      //     that.$message.success(message)

      //   })
      //   .catch(function (error) {
      //     console.log('catch-----------')
      //     // 处理错误情况
      //     that.$confirm({
      //       title: errorMessage,
      //       content: '请求失败是否回滚页面数据,以保持数据一致？',
      //       onOk() {
      //         return new Promise((resolve) => {
      //           that.undoPageData = true
      //           that.undo()
      //           resolve()
      //         }).then(() => { that.undoPageData = false });
      //       },
      //       onCancel() {
      //         that.undoPageData = false
      //       },
      //     });
      //     console.log(error);
      //   })
      //   .finally(function () {
      //     // 总是会执行
      //     that.loadingKey && (that[that.loadingKey + 'Loading'] = false)
      //     that.loadingKey = ''
      //   });

    },
    // 连线更新
    linkUpdate(id, mode, link) {
      // const that = this
      // // 仅回滚页面，则直接返回
      // if (that.undoPageData) {
      //   return
      // }
      // const { method, message, errorMessage } = that.reqHandle(mode)

      // axios[method](`api/data/link/${method != 'post' ? id : ''}`, link)
      //   .then(function (response) {
      //     console.log('then-----------')
      //     if (response.data.action == 'error') {
      //       throw new Error()
      //     }
      //     // 处理成功情况
      //     that.$message.success(message)

      //   })
      //   .catch(function (error) {
      //     console.log('catch-----------')
      //     // 处理错误情况
      //     that.$confirm({
      //       title: errorMessage,
      //       content: '请求失败是否回滚页面数据,以保持数据一致？',
      //       onOk() {
      //         return new Promise((resolve) => {
      //           that.undoPageData = true
      //           that.undo()
      //           resolve()
      //         }).then(() => { that.undoPageData = false });
      //       },
      //       onCancel() {
      //         that.undoPageData = false
      //       },
      //     });
      //     console.log(error);
      //   })
      //   .finally(function () {
      //     // 总是会执行
      //   });
    },
    // 获取当前选中任务
    selectTask: function (task) {
      console.log('selected', task)
      this.selectedTask = task;
    },
    undo() {
      this.loadingKey = 'undo'
      this.$refs.gantt.performAction('undo')
    },
    redo() {
      this.loadingKey = 'redo'
      this.$refs.gantt.performAction('redo')
    },
    indent() {
      this.loadingKey = 'indent'
      this.$refs.gantt.performAction('indent')
    },
    outdent() {
      this.loadingKey = 'outdent'
      this.$refs.gantt.performAction('outdent')
    },
    del() {
      this.loadingKey = 'del'
      this.$refs.gantt.performAction('del')
    },
    moveForward() {
      this.loadingKey = 'moveForward'
      this.$refs.gantt.performAction('moveForward')
    },
    moveBackward() {
      this.loadingKey = 'moveBackward'
      this.$refs.gantt.performAction('moveBackward')
    },
    fullscreen() {
      this.ganttInstance.ext.fullscreen.toggle()
    },
  },
};
</script>

<style lang="scss" scoped>
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

.container {
  height: 100vh;
  width: 100%;
}

#main-gantt {
  z-index: 9999 !important;
  background-color: #fff;
}

.left-container {
  overflow: hidden;
  position: relative;
  height: 100%;
}

.right-container {
  border-right: 1px solid #cecece;
  float: right;
  height: 100%;
  width: 340px;
  box-shadow: 0 0 5px 2px #aaa;
  position: relative;
  z-index: 2;
}

.gantt-messages {
  list-style-type: none;
  height: 50%;
  margin: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-left: 5px;
}

.gantt-messages>.gantt-message {
  background-color: #f4f4f4;
  box-shadow: inset 5px 0 #d69000;
  font-family: Geneva, Arial, Helvetica, sans-serif;
  font-size: 14px;
  margin: 5px 0;
  padding: 8px 0 8px 10px;
}

.gantt-selected-info {
  border-bottom: 1px solid #cecece;
  box-sizing: border-box;
  font-family: Geneva, Arial, Helvetica, sans-serif;
  height: 50%;
  line-height: 28px;
  padding: 10px;
}

.gantt-selected-info h2 {
  border-bottom: 1px solid #cecece;
}

.select-task-prompt h2 {
  color: #d9d9d9;
}

.data-scale {
  padding: 8px 0;
  margin-right: 16px;
}

.tools-list {
  display: flex;
  justify-content: right;
  align-items: center
}

.tool-button {
  margin-right: 16px;
}

::v-deep.ant-btn {
  padding: 0 8px !important;
}
</style>
