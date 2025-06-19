<template>
  <div
    class="scroll-container"
    ref="scrollContainer"
    @wheel.prevent="handleWheel"
    @touchstart="startDrag"
    @touchmove="duringDrag"
    @touchend="endDrag"
  >
    <div class="content">
      <!-- 这里放超宽内容 -->
      <div v-for="i in 20" :key="i" class="item">Item {{ i }}</div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isDragging: false,
      startX: 0,
      startScrollLeft: 0,
      pendingWheelDelta: 0,
      isWheeling: false,
      supportsPassive: false // 通过特性检测初始化
    }
  },
  mounted() {
    // 检测 passive 支持
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: () => (this.supportsPassive = true)
      });
      window.addEventListener('test', null, opts);
    } catch (e) {}

    const container = this.$refs.scrollContainer;
    const options = this.supportsPassive ? { passive: true } : false;
    container.addEventListener('wheel', this.handleWheel, options);
  },
  methods: {
    handleWheel(event) {
      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 33;

      if (!this.supportsPassive) {
        event.preventDefault();
      }

      this.pendingWheelDelta = delta;

      if (!this.isWheeling) {
        this.isWheeling = true;
        requestAnimationFrame(this.applyScroll);
      }
    },
    applyScroll() {
      const container = this.$refs.scrollContainer;
      const currentScroll = container.scrollLeft;
      const newScroll = currentScroll + this.pendingWheelDelta * 0.5;

      container.scrollLeft = newScroll;

      this.pendingWheelDelta = 0;
      this.isWheeling = false;
    },
    startDrag(e) {
      this.isDragging = true;
      this.startX = e.touches[0].clientX;
      this.startScrollLeft = this.$refs.scrollContainer.scrollLeft;
    },
    duringDrag(e) {
      if (!this.isDragging) return;
      const x = e.touches[0].clientX;
      const walk = (x - this.startX) * 2;
      this.$refs.scrollContainer.scrollLeft = this.startScrollLeft - walk;
    },
    endDrag() {
      this.isDragging = false;
    }
  }
}
</script>

<style>
.scroll-container {
  overflow-x: auto;
  white-space: nowrap;
  width: 100%;
  scroll-behavior: smooth;
  cursor: grab;
}

.scroll-container:active {
  cursor: grabbing;
}

.content {
  display: inline-block;
  padding: 20px;
}

.item {
  display: inline-block;
  width: 100px;
  height: 40px;
  margin-right: 10px;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 20px;
}
</style>
