const app = getApp();
const config = app.config;   //host地址
const wafer = require('../../vendors/wafer-client-sdk/index');
const lab = require('../../lib/lab');

Page({
  data: {
    status: 'waiting',
    url: 'wss://' + config.host + '/ws',
    connecting: false,
    ColorList: app.globalData.ColorList,
    index: null,
    picker: ['体育新闻', '财经新闻', '综合新闻'],
    fuck: '这是用户输入的信息',
    select: false,
    tihuoWay: '请选择新闻类型',
    xuanZe: '请选择新闻类型',
    tiShi: '请输入一句话简单概括新闻事件：',
    yuLan: '新闻预览：',
    output: '暂无',
    newstype: ''
  },
  /**select表单**/
  onLoad:function(options){
    this.connect()
  },
  bindShowMsg(){
    this.setData({
      select:!this.data.select
    })
  },
  mySelect(e){
    var name=e.currentTarget.dataset.name
    this.setData({
      tihuoWay:name,
      select:false
    });
    if(name=='体育新闻'){
      this.send("1");
      console.log('send 1');
    }
    else if(name=='财经新闻'){
      this.send("2");
      console.log('send 2');
    }
    else{
      this.send("3");
      console.log('send 3');
    }
  },
  formBindsubmit: function (e) {
    this.setData({
      fuck: e.detail.value.in,
      output: '这是GPT2生成的新闻'
    });
    this.send(this.data.fuck);
  },
  formReset: function () {
    this.setData({
      output: '暂无'
    })
  },
  /**
   * WebSocket 是否已经连接
   */
  socketOpen: false,

  /**
   * 开始连接 WebSocket
   */
  connect() {
    this.setData({
      status: 'waiting',
      connecting: true,
      hintLine1: '正在连接',
      hintLine2: '...'
    });
    this.listen();
    wafer.setLoginUrl(`https://${config.host}/login`);
    wafer.login({
      success: () => {
        const header = wafer.buildSessionHeader();
        const query = Object.keys(header).map(key => `${key}=${encodeURIComponent(header[key])}`).join('&');
        wx.connectSocket({
          // 小程序 wx.connectSocket() API header 参数无效，把会话信息附加在 URL 上
          url: `${this.data.url}?${query}`,
          header
        });
      },
      fail: (err) => {
        this.setData({
          status: 'warn',
          connecting: false,
          hintLine1: '登录失败',
          hintLine2: err.message || err
        });
      }
    });
  },

  /**
   * 监听 WebSocket 事件
   */
  listen() {
    wx.onSocketOpen(() => {
      this.socketOpen = true;
      this.setData({
        status: 'success',
        connecting: false,
        hintLine1: '连接成功',
        hintLine2: '现在可以通过 WebSocket 发送接收消息了'
      });
      console.info('WebSocket 已连接');
      setInterval(this.heart, 1000);
    });
    wx.onSocketMessage((message) => {
      this.setData({
        output:message.data
      });
      lab.finish('websocket');
    });
    wx.onSocketClose(() => {
      this.setData({
        status: 'waiting',
        hintLine1: 'WebSocket 已关闭'
      });
      console.info('WebSocket 已关闭');
    });
    wx.onSocketError(() => {
      setTimeout(() => {
        this.setData({
          status: 'warn',
          connecting: false,
          hintLine1: '发生错误',
          hintLine2: 'WebSocket 连接建立失败'
        });
      });
      console.error('WebSocket 错误');
    });
  },

  /**
   * 发送一个包含当前时间信息的消息
   */
  send(message) {
    wx.sendSocketMessage({
      data: message
    });
    console.log(message)
  },
  heart(){
    var message='ping'
    wx.sendSocketMessage({
      data: message,
    });
  },
  /**
   * 关闭 WebSocket 连接
   */
  close() {
    this.socketOpen = false;
    wx.closeSocket();
  }
  
});