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
  },
    /**
   * go事件 /post/post /index/index
   */
  go:function(){
    wx.redirectTo({
      url:'../index/index',
    })
  },
  SetShadow(e) {
    this.setData({
      shadow: e.detail.value
    })
  },
  SetBorderSize(e) {
    this.setData({
      bordersize: e.detail.value
    })
  },
  onLoad:function(options){
    this.connect()
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