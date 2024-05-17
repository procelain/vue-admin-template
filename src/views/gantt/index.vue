<template>
  <div>
    <button @click="demoViewMode('day')">Day View Mode</button>
    <button @click="demoViewMode('week')">Week View Mode</button>
    <button @click="demoViewMode('month')">Month View Mode</button>
    <frappe-gantt :view-mode="mode" :tasks="tasks" @task-updated="debugEventLog.push($event)"
      @task-date-updated="debugEventLog.push($event)" @task-progress-change="debugEventLog.push($event)" />
    <button @click="addRandomTask">Add</button>
  </div>
</template>

<script>
import FrappeGantt from "./frappe-gantt.vue";
// const uuidv5 = require('uuid/v5');
import uuidv4 from "uuid/v4";

export default {
  name: "App",
  components: {
    FrappeGantt,
  },
  data() {
    return {
      mode: "week",
      tasks: [
        {
          id: "1",
          name: "Hello",
          start: "2019-01-01",
          end: "2019-01-05",
          progress: 10,
        },
        {
          id: "2",
          name: "World",
          start: "2019-01-05",
          end: "2019-01-10",
          progress: 20,
          dependencies: "1",
        },
        {
          id: "3",
          name: "From",
          start: "2019-01-10",
          end: "2019-01-15",
          progress: 30,
          dependencies: "2",
        },
        {
          id: "4",
          name: "Lloyd",
          start: "2019-01-15",
          end: "2019-01-20",
          progress: 40,
          dependencies: "3",
        },
        {
          id: "5",
          name: "Llhoyd",
          start: "2019-01-20",
          end: "2019-01-25",
          progress: 40,
          dependencies: "4",
        },
      ],
      debugEventLog: [],
    };
  },
  methods: {
    addRandomTask() {
      const id = uuidv4();
      this.tasks.push({
        id: id,
        name: id,
        start: "2019-01-01",
        end: "2019-01-05",
        progress: Math.random() * 100,
      });
    },
    demoViewMode(viewMode) {
      this.mode = viewMode;
    },
  },
};
</script>

<style lang="scss">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  //   text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
