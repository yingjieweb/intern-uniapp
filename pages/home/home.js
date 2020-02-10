// pages/home/home.js
import { getMultiData, getProduct } from '../../service/home.js'

Page({
  data: {
    banners:[],
    recommends:[]
  },
  onLoad: function (options) {
    //请求图片及数据
    getMultiData().then(res => {
      const banners = res.data.banner.list;
      const recommends = res.data.recommend.list;
      
      //将banners和recommends放到data中
      this.setData({
        banners:banners,
        recommends:recommends
      })
    })
  }
})