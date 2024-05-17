<template>
  <div ref="ganttContainer" style="width: 100%; height: calc(100% - 48px)"></div>
</template>

<script>
import { gantt } from "dhtmlx-gantt";
import 'dhtmlx-gantt/codebase/sources/skins/dhtmlxgantt_material.css'
export default {
  props: {
    tasks: {
      type: Object,
      default() {
        return {
          data: [

          ],
          collections: {
            links: [],
          }
        };
      },
    },
    config: {
      type: Object,
      default() {
        return {};
      },
    }
  },
  data() {
    return {
      styleName: "dhtmlxgantt_material", // 默认样式文件名称
      performAction: null,
      ganttEvent: {}
    };
  },
  watch: {
    config: {
      immediate: false,
      deep: true,
      handler(value) {
        gantt.config.scales = this.setScale(value.dataScale);
        gantt.render();
      },
    },
  },
  created() {
    this.start = performance.now();
  },
  mounted: function () {
    this.init();
  },
  methods: {
    init() {
      // 初始化事件
      this.initGanttEvents();
      // 配置
      this.setConfig();
      this.performAction = this.handleAction()
      // 初始化
      gantt.init(this.$refs.ganttContainer);
      // 解析数据
      gantt.parse(this.tasks);
      // 初始化数据处理
      this.initDataProcessor();
      this.end = performance.now();
      console.log("操作执行时间：", this.end - this.start, "毫秒");
    },
    // 配置信息
    setConfig() {
      // -------1、左侧区域--------
      gantt.config.grid_width = 300; //左侧宽
      gantt.config.autofit = false; //左侧是否自适应
      gantt.config.date_grid = "%F %d"; //左侧日期数据展示格式
      // --------1.1左侧区域头部-------
      // 设置表头
      this.setColumn();

      // 拖拽排序
      gantt.config.order_branch = true;
      gantt.config.order_branch_free = true;
      gantt.config.resize_rows = true;


      gantt.config.scales = this.setScale(this.config.dataScale);
      // gantt.config.row_height = 50;   //进度条容器高

      // 里程碑文本居右
      gantt.templates.rightside_text = function (start, end, task) {
        if (task.type == gantt.config.types.milestone) {
          return task.text;
        }
        return "";
      };
      // ===========通用配置（国际化，日期格式等）=======
      this.managePlugins();
      gantt.i18n.setLocale("cn");
      // 日期格式
      gantt.config.date_format = "%Y-%m-%d";
      gantt.config.readonly = false; //只读
      gantt.config.fit_tasks = true; //自动调整图表坐标轴区间用于适配task的长度
      gantt.config.wide_form = false; //  弹窗宽
    },
    // 设置右侧头部展示日期方式
    setScale(value) {
      gantt.config.scale_height = 100; //设置时间刻度的高度和网格的标题
      const weekScaleTemplate = function (date) {
        // 可以时使用dayjs 处理返回
        const dateToStr = gantt.date.date_to_str("%d");
        const mToStr = gantt.date.date_to_str("%M");
        const endDate = gantt.date.add(
          gantt.date.add(date, 1, "week"),
          -1,
          "day"
        );
        // 处理一下月份
        return `${dateToStr(date)} 号 - ${dateToStr(endDate)} 号 (${mToStr(
          date
        )})`;
      };
      const daysStyle = function (date) {

        if (date.getDay() === 0 || date.getDay() === 6) {
          return "weekend";
        }
        return "";
      };
      switch (value) {
        case "Days":
          return [
            { unit: "week", step: 1, date: "%Y年 %W周" },
            { unit: "day", step: 1, date: "%m-%d", css: daysStyle },
          ];
        case "Months":
          return [
            { unit: "month", step: 1, date: "%M" },
            { unit: "week", step: 1, date: "%W周" },
          ];
        case "Years":
          return [
            { unit: "year", step: 1, date: "%Y年" },
            { unit: "month", step: 1, date: "%M" },
          ];
        case "Week":
          return [
            { unit: "year", step: 1, date: "%Y" },
            { unit: "week", step: 1, format: weekScaleTemplate },
            { unit: "day", step: 1, date: "%D", css: daysStyle },
          ];
        default:
          return {};
      }
    },
    // 自定义表格列
    setColumn() {
      // gantt.config.columns = [
      //   {
      //     name: "text",
      //     label: "里程碑节点",
      //     width: 280,
      //     tree: true,
      //     template: function (obj) {
      //       return `节点：${obj.text}`; // 通过 template 回调可以指定返回内容值
      //     },
      //   },
      // ];
    },
    managePlugins() {
      // 插件
      gantt.plugins({
        click_drag: true,
        drag_timeline: true, // 拖动图
        marker: true, // 时间标记
        fullscreen: true, // 全屏
        tooltip: true, // 鼠标经过时信息
        undo: true, // 允许撤销
        multiselect: true, //eachSelectedTask可用
        auto_scheduling: true, //自动调度
        quick_info: false, //进度条点击展示快捷面板
      });
      // auto_scheduling管理
      gantt.config.work_time = true; //自动调度须设置一下
      gantt.config.min_column_width = 60;
      gantt.config.auto_scheduling = true;
      gantt.config.auto_scheduling_strict = true;

      // multiselect(如果不设置会重复触发请求)
      gantt.config.drag_multiple = false;
      gantt.config.multiselect = false;
      // 基线
      var dateToStr = gantt.date.date_to_str(gantt.config.task_date);
      let today = this.getEndOfDate(); // getEndOfDate 为获取今天结束时间的方法
      gantt.addMarker({
        start_date: today,
        css: "status_line",
        text: "今日",
      });
      var start = new Date(1907, 9, 9);
      gantt.addMarker({
        start_date: start,
        css: "projectStartDate",
        text: "开始时间",
        title: "开始时间: " + dateToStr(start),
      });
      // drag
      gantt.config.drag_links = true; //可连线
      gantt.config.drag_progress = true; // 进度条可拖拽
      // tooltip
      // 自定义tooltip内容
      gantt.templates.tooltip_text = function (start, end, task) {
        const t = gantt;
        const output = `<b>里程碑：</b>${task.text
          }<br/><b>计划开始时间：</b>${t.templates.tooltip_date_format(
            start
          )}<br/><b>计划结束时间：</b>${t.templates.tooltip_date_format(end)}`;
        return output;
      };
      gantt.ext.fullscreen.getFullscreenElement = function () {
        console.log(document.getElementById("main-gantt"))
        return document.getElementById("main-gantt");
      }
    },
    // 事件监听
    initGanttEvents: function () {
      if (!gantt.$_eventsInitialized) {
        // 选中
        this.ganttEvent.onTaskSelected = gantt.attachEvent("onTaskSelected", (id) => {
          let task = gantt.getTask(id);
          this.$emit("task-selected", task);
        });
        this.ganttEvent.onTaskIdChange = gantt.attachEvent("onTaskIdChange", (id, new_id) => {
          if (gantt.getSelectedId() == new_id) {
            let task = gantt.getTask(new_id);
            this.$emit("task-selected", task);
          }
        });
        // 线条click
        this.ganttEvent.onLinkClick = gantt.attachEvent("onLinkClick", function (id) {
          var link = this.getLink(id),
            src = this.getTask(link.source),
            trg = this.getTask(link.target),
            types = this.config.links;

          var first = "",
            second = "";
          switch (link.type) {
            case types.finish_to_start:
              first = "finish";
              second = "start";
              break;
            case types.start_to_start:
              first = "start";
              second = "start";
              break;
            case types.finish_to_finish:
              first = "finish";
              second = "finish";
              break;
            case types.start_to_finish:
              first = "start";
              second = "finish";
              break;
          }

          gantt.message(
            "Must " +
            first +
            " <b>" +
            src.text +
            "</b> to " +
            second +
            " <b>" +
            trg.text +
            "</b>"
          );
        });
        // 任务添加完成后钩子
        this.ganttEvent.onAfterTaskAdd = gantt.attachEvent("onAfterTaskAdd", function (id, item) {
          console.log(id, item);
        });
        // 任务删除后钩子
        this.ganttEvent.onAfterTaskDelete = gantt.attachEvent("onAfterTaskDelete", function (id, item) {
          console.log(id, item);
        });
        // 修改任务
        this.ganttEvent.onAfterTaskUpdate = gantt.attachEvent("onAfterTaskUpdate", (id, data) => {
          console.log(id, data);

        });
        // 监听进度拖拽事件
        this.ganttEvent.onTaskDrag = gantt.attachEvent("onTaskDrag", function (id, mode, e) {
          console.log('66666', id, mode, e)
          return true;
        });
        this.ganttEvent.onBeforeTaskDrag = gantt.attachEvent("onBeforeTaskDrag", function (id, mode, e) {
          console.log(id, mode, e)
          return true;
        });

        // 移动项目
        this.ganttEvent.onAfterTaskDrag = gantt.attachEvent("onAfterTaskDrag", function (id, mode, task, original) {
          console.log(id, mode, task, original)
          return true
        });
        // 用户完成拖动并释放鼠标
        this.ganttEvent.onAfterTaskChanged = gantt.attachEvent("onAfterTaskChanged", (id, mode, task) => {
          console.log(id, mode, task);

        });

        // 删除连接项目关系
        this.ganttEvent.onAfterLinkDelete = gantt.attachEvent("onAfterLinkDelete", (id, item) => {
          console.log(id, item);

        });
        // 修改连接项目关系
        this.ganttEvent.onAfterLinkUpdate = gantt.attachEvent("onAfterLinkUpdate", (id, item) => {
          console.log(id, item);

        });
        // 新增连接项目关系
        this.ganttEvent.onBeforeLinkAdd = gantt.attachEvent("onBeforeLinkAdd", (id, item) => {
          console.log(id, item);
        });

        // 弹窗打开前钩子（可禁用自带编辑弹窗）
        this.ganttEvent.onBeforeLightbox = gantt.attachEvent(
          "onBeforeLightbox",
          function (id) {
            console.log(id);
            return true; // 返回 false
          },
          {}
        );
        // 任务双击钩子
        this.ganttEvent.onTaskDblClick = gantt.attachEvent(
          "onTaskDblClick",
          function (id, e) {
            console.log("id", id, e);
            return true;
          },
          {}
        );
        // 展示tooltip
        this.ganttEvent.onGanttReady = gantt.attachEvent("onGanttReady", function () {
          var tooltips = gantt.ext.tooltips;
          tooltips.tooltip.setViewport(gantt.$task_data);
        });
        this.ganttEvent.onBeforeTaskAutoSchedule = gantt.attachEvent("onBeforeTaskAutoSchedule", function (task, predecessor) {
          // 在此处执行自定义操作
          console.log("Before auto-schedule for task:", task.text);
          console.log("Predecessor:", predecessor);
          // 返回 true 表示允许自动调度，返回 false 则取消自动调度
          return true;
        });
        gantt.$_eventsInitialized = true;
      }
    },
    // 数据变化监听
    initDataProcessor: function () {
      if (!gantt.$_dataProcessorInitialized) {
        gantt.createDataProcessor((entity, action, data, id) => {
          this.$emit(`${entity}-updated`, id, action, data);
        });
        gantt.$_dataProcessorInitialized = true;
      }
    },
    getEndOfDate() {
      const today = new Date();
      // 将日期设置为当天的开始
      today.setHours(23);
      today.setMinutes(59);
      today.setSeconds(59);
      today.setMilliseconds(999);
      return today;
    },
    // 进度条前进后退
    shiftTask(task_id, direction) {
      const task = gantt.getTask(task_id);
      task.start_date = gantt.date.add(task.start_date, direction, "day");
      task.end_date = gantt.calculateEndDate(task.start_date, task.duration);
      gantt.updateTask(task.id);
    },
    handleAction() {
      const that = this
      const actions = {
        undo: function () {
          gantt.ext.undo.undo();
        },
        redo: function () {
          gantt.ext.undo.redo();
        },
        del: function (task_id) {
          if (gantt.isTaskExists(task_id)) gantt.deleteTask(task_id);
          return task_id;
        },
        moveForward: function (task_id) {
          that.shiftTask(task_id, 1);
        },
        moveBackward: function (task_id) {
          that.shiftTask(task_id, -1);
        }
      };
      const cascadeAction = {
        del: true
      };

      const singularAction = {
        undo: true,
        redo: true
      };

      gantt.performAction = function (actionName) {
        var action = actions[actionName];
        if (!action)
          return;

        if (singularAction[actionName]) {
          action();
          return;
        }

        gantt.batchUpdate(function () {

          // need to preserve order of items on indent/outdent,
          // remember order before changing anything:
          const indexes = {};
          const siblings = {};
          gantt.eachSelectedTask(function (task_id) {
            gantt.ext.undo.saveState(task_id, "task");
            indexes[task_id] = gantt.getTaskIndex(task_id);
            siblings[task_id] = {
              first: null
            };

            let currentId = task_id;
            while (gantt.isTaskExists(gantt.getPrevSibling(currentId)) && gantt.isSelectedTask(gantt.getPrevSibling(currentId))) {
              currentId = gantt.getPrevSibling(currentId);
            }
            siblings[task_id].first = currentId;
          });

          const updated = {};
          gantt.eachSelectedTask(function (task_id) {

            if (cascadeAction[actionName]) {
              if (!updated[gantt.getParent(task_id)]) {
                const updated_id = action(task_id, indexes, siblings);

                updated[updated_id] = true;
              } else {
                updated[task_id] = true;
              }
            } else {
              action(task_id, indexes);
            }
          });
        });
      };
      return gantt.performAction
    }
  },
  destroyed() {
    // 销毁gantt事件
    for (let i in this.ganttEvent) {
      gantt.detachEvent(this.ganttEvent[i])
    }
    gantt.ext.tooltips.tooltip.hide();
  }
};
</script>

<style>
.weekend {
  background: #f4f7f4 !important;
}

.gantt_selected .weekend {
  background: #fff3a1 !important;
}

.projectStartDate,
.projectEndDate {
  background-color: #0dd1eb !important;
}

.gantt_row_project {
  font-weight: bold;
}
</style>
