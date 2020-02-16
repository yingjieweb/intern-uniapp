// components/w-tab-control/w-tab-control.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    titles: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    currentIndex: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    itemClick(event) {
      // 1.取出index
      const index = event.currentTarget.dataset.index;

      // 2.设置最新的index
      this.setData({
        currentIndex: index
      })

      // 3.通知页面内部发生点击事件
      this.triggerEvent("tabclick",{index,titles:this.properties.titles[index]},{})
    }
  }
})
