// pages/home/childCpns/w-recommend.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    recommends: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isLoad: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleImageLoad(){
      if (!this.data.isLoad){  //这样做是为了防止多个图片加载完成都会调用该函数，
        this.triggerEvent('imageLoad');
        this.data.isLoad = true;
      }
    }
  }
})
