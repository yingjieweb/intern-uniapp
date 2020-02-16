// pages/home/home.js
import { getMultiData, getProduct } from '../../service/home.js'

const types = ['pop','new','sell']  //方便设置currentType
const BACKTOP_DISTANCE = 1000;

Page({
  data: {
    banners:[],
    recommends:[],
    titles: ['流行','新款','精选'],
    goods: {
      pop: { page: 0, list: [] },
      new: { page: 0, list: [] },
      sell: { page: 0, list: [] },
    },
    currentType:'pop',
    showBackTop:false
  },
  onLoad: function (options) {
    //1.请求轮播图和推荐的数据
    this._getMultiData()

    //2.请求商品数据
    this._getProduct('pop')
    this._getProduct('new')
    this._getProduct('sell')
  },
  //---------------------事件监听函数---------------------
  tabClick(event) {
    //1. 取出index
    const index = event.detail.index;

    //2.设置currentType
    this.setData({
      currentType:types[index]
    })
  },
  //---------------------网络请求函数---------------------
  _getMultiData(){
    //请求轮播图和推荐的数据
    getMultiData().then(res => {
      const banners = res.data.banner.list;
      const recommends = res.data.recommend.list;

      //将banners和recommends放到data中
      this.setData({
        banners: banners,
        recommends: recommends
      })
    })
  },
  //请求商品数据
  _getProduct(type) {
    //1.获取页码
    const page = this.data.goods[type].page + 1;

    //2.发送网络请求
    getProduct(type, page).then(res => {
      //2.1取出数据
      const list = res.data.list;

      //2.2将数据设置到对应的type的list中
      const goods = this.data.goods;
      goods[type].list.push(...list)  //数组的解构赋值
      goods[type].page += 1;

      //2.3.最新的goods设置到goods中
      this.setData({
        goods: goods
      })
    })
  }
  //当页面滚动到底部，做上拉加载更多
  ,onReachBottom(){
    this._getProduct(this.data.currentType)
  },
  //监听页面滚动，当到一定位置显示backTop
  onPageScroll(options){
    //1.取出scrollTop
    const scrollTop = options.scrollTop;

    //2.修改showBackTop属性
    //注意：官方表示，不要在滚动函数回调中频繁调用this.setData
    const flag = scrollTop >= BACKTOP_DISTANCE
    if(flag != this.data.showBackTop)
    this.setData({
      showBackTop:flag
    })
  }
})