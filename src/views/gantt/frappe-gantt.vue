<template>
  <div style="height: 400px">
    <svg ref="gantt"></svg>
  </div>
</template>

<script>
import Gantt from "frappe-gantt";

export default {
  name: "FrappeGantt",
  props: {
    viewMode: {
      type: String,
      required: false,
      default: "Month",
    },
    tasks: {
      type: Array,
      required: true,
      default: [],
    },
  },
  data() {
    return {
      gantt: {},
    };
  },
  watch: {
    viewMode() {
      this.updateViewMode();
    },

    tasks() {
      this.updateTasks();
    },
  },
  mounted() {
    this.setupGanttChart();
    this.$nextTick(() => {
      this.changeGanttStrc();
    });
  },
  methods: {
    changeGanttStrc() {
      // 获取原始 SVG 的宽度
      const originalSvgWidth = document
        .querySelector(".gantt")
        .getAttribute("width");

      // 创建一个新的 SVG 元素
      const newSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      newSvg.setAttribute("height", "60"); // 设置新 SVG 的高度，这里根据需要调整
      newSvg.setAttribute("width", originalSvgWidth); // 设置新 SVG 的宽度为原始 SVG 的宽度
      newSvg.setAttribute("class", "gantt");
      // 获取原始 SVG 中的 grid-header 和 date 元素
      const gridHeader = document.querySelector(".grid-header");
      const date = document.querySelector(".date");
      gridHeader.setAttribute("height", "60");
      // 将 grid-header 和 date 元素从原始 SVG 中移除
      this.$refs.gantt.querySelector(".grid").removeChild(gridHeader);
      this.$refs.gantt.removeChild(date);

      // 将 grid-header 和 date 元素分别插入到新的 SVG 中
      newSvg.appendChild(gridHeader.cloneNode(true));
      newSvg.appendChild(date.cloneNode(true));

      // 将新的 SVG 插入到 gantt-container 元素最前面
      const ganttContainer = document.querySelector(".gantt-container");
      ganttContainer.insertBefore(newSvg, ganttContainer.firstChild);

      // 获取所有的 lower-text 元素并设置 y 属性为 50
      const lowerTexts = document.querySelectorAll(".date .lower-text");
      lowerTexts.forEach((text) => {
        text.setAttribute("y", "50");
      });

      // 获取所有的 upper-text 元素并设置 y 属性为 25
      const upperTexts = document.querySelectorAll(".date .upper-text");
      upperTexts.forEach((text) => {
        text.setAttribute("y", "25");
      });

      // 创建一个包裹第二个 SVG 的 div 元素
      const divWrapper = document.createElement("div");
      divWrapper.setAttribute(
        "style",
        "max-height: 150px; overflow-y: auto; overflow-x: auto;"
      );

      // 获取 gantt-container 下的所有 SVG 元素
      const svgs = document.querySelectorAll(".gantt-container > .gantt");
      console.log("svgs", svgs);
      // 如果存在第二个 SVG 元素，将其放置在 divWrapper 中
      if (svgs.length > 1) {
        const svg2 = svgs[1];
        divWrapper.appendChild(svg2);
      }

      // 将 divWrapper 插入到 ganttContainer 中
      ganttContainer.appendChild(divWrapper);
      ganttContainer.setAttribute("style", "overflow:unset");

      divWrapper.addEventListener("scroll", function () {
        // 获取甘特图容器的水平滚动位置
        const scrollLeft = divWrapper.scrollLeft;

        // 将滚动位置应用到头部 SVG 上
        newSvg.style.transform = `translateX(-${scrollLeft}px)`;
      });
      // 获取包含日期和月份信息的 DOM 元素
      const dateGroup = date;

      // 创建表格头部的 HTML 结构
      let tableHeaderHTML = "<thead><tr>";

      // 遍历日期和月份信息的 DOM 元素中的所有 <text> 元素
      dateGroup.querySelectorAll("text").forEach((textElement) => {
        const text = textElement.textContent;
        const isUpperText = textElement.classList.contains("upper-text");

        // 根据是否是月份信息来确定表格头部的结构
        if (isUpperText) {
          // 如果是月份信息，则创建一个占据整行的表头单元格
          tableHeaderHTML += `<th colspan="5">${text}</th>`;
        } else {
          // 如果是日期信息，则创建一个普通的表头单元格
          tableHeaderHTML += `<th>${text}</th>`;
        }
      });

      // 关闭表格头部的 HTML 结构
      tableHeaderHTML += "</tr></thead>";

      // 将表格头部的 HTML 结构插入到表格中
      const table = document.createElement("table");
      table.innerHTML = tableHeaderHTML;
    },
    setupGanttChart() {
      this.gantt = new Gantt(this.$refs.gantt, this.tasks, {
        on_click: (task) => {
          this.$emit("task-updated", task);
        },

        on_date_change: (task, start, end) => {
          this.$emit("task-date-updated", { task, start, end });
        },

        on_progress_change: (task, progress) => {
          this.$emit("task-progress-updated", { task, progress });
        },

        //I doubt you will ever need this as the developer already knows what view mode they set.
        on_view_change: (mode) => {
          this.$emit("view-mode-updated", mode);
        },
        header_height: 0,
      });

      this.updateTasks();
      this.updateViewMode();
    },

    updateViewMode() {
      this.gantt.change_view_mode(
        this.viewMode[0].toUpperCase() + this.viewMode.substring(1)
      );
    },

    updateTasks() {
      this.gantt.refresh(this.tasks);
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep.gantt-container {
  overflow: hidden !important;
}
</style>
