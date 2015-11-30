/*
 *  DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *  Version 2, December 2004
 *
 *  Copyright (C) 2013-2015 sbxfc http://rungame.me
 *
 *  Everyone is permitted to copy and distribute verbatim or modified
 *  copies of this license document, and changing it is allowed as long
 *  as the name is changed.
 *
 *  DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *  TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
 *
 *  0. You just DO WHAT THE FUCK YOU WANT TO.
 */


var WebSocket = WebSocket || window.WebSocket || window.MozWebSocket;

var CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_OPEN = "custom_event_select_server_socket_on_open";
var CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_ERROR = "custom_event_select_server_socket_on_error";
var CUSTOM_EVENT_SELECT_SERVER_SOCKET_CLOSED = "custom_event_select_server_socket_closed";
var CUSTOM_EVENT_GAME_SOCKET_ON_OPEN = "custom_event_game_socket_on_open";
var CUSTOM_EVENT_GAME_SOCKET_ON_ERROR = "custom_event_game_socket_on_error";
var CUSTOM_EVENT_GAME_SOCKET_CLOSED = "custom_event_game_socket_closed";

var SOCKET_TYPE_GAME = 0;
var SOCKET_TYPE_SELECT_SERVER = 1;
var SOCKET_DATA_TYPE_BINARY = "arraybuffer";
var IOSocket = cc.Class.extend({
    _socket: null,
    _host: null,
    _socketType: 0,
    _isConnected: false,
    _cachedRequests: null,
    _cachedReceivedData: null,
    isReconnect: false,//重新连接服务器
    initNetwork: function (host, type) {

        GameLog.log('Socket初始化');

        if (this._cachedRequests) {
            this._cachedRequests = [];
        }
        this.isReconnect = false;
        this._host = host;
        this._socketType = type === undefined ? SOCKET_TYPE_GAME : type;
        this.connect();
    },
    /**
     * 发送数据
     */
    send: function (data) {
        if (!this._isConnected) {
            GameLog.log('Socket is not connect...');
            this.cacheRequest(data);
            this.reconnect();
        }
        else if (this._socket.readyState == WebSocket.OPEN) {
            this._socket.send(data);
        }
        else {
            GameLog.log('WebSocket readState:' + this.socket.readyState);
            this.cacheRequest(data);
        }
    },
    close: function () {
        if (this._socket) {
            GameLog.log("Network close...");
            this._socket.close();
            this._socket = null;
            this._isConnected = false;
        }
    },
    /**
     * 清空缓存的协议数据
     */
    _cleanupCacheData: function () {
        if (this._cachedReceivedData) {
            this._cachedReceivedData.splice(0);
        }
    },
    /**
     * 缓存协议数据
     */
    cacheRequest: function (data) {
        if (!this._cachedRequests) {
            this._cachedRequests = [];
        }
        this._cachedRequests.push(data);
    },
    sendCachedRequest: function () {
        if (Array.isArray(this._cachedRequests) && this._cachedRequests.length > 0) {
            for (var i = 0; i < this._cachedRequests.length; i++) {
                var data = this._cachedRequests[i];
                if (data instanceof ArrayBuffer) {
                    self.send(data);
                }
            }
        }
    },
    /**
     * 重新连接
     */
    reconnect: function () {
        this.isReconnect = true;
        this.connect();
    },
    connect: function () {
        this._cleanupCacheData();
        var self = this;
        this._socket = new WebSocket(this._host);
        this._socket.binaryType = SOCKET_DATA_TYPE_BINARY;
        this._socket.onopen = function (evt) {
            GameLog.log('Socket连接成功！');
            self._isConnected = true;
            var eventName = CUSTOM_EVENT_GAME_SOCKET_ON_OPEN;
            if (self._socketType === SOCKET_TYPE_SELECT_SERVER) {
                eventName = CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_OPEN;
            }
            var event = new cc.EventCustom(eventName);
            cc.eventManager.dispatchEvent(event);
        };
        this._socket.onmessage = function (evt) {//收到服务器消息
            var data = null;
            if (evt.data instanceof ArrayBuffer) {
                data = evt.data;
            }
            else {
                GameLog.log("接收到的数据格式为:" + (typeof evt.data));
            }

            if (data !== null) {
                self._parseProtocalData(data);
            }
        };
        //报错
        this._socket.onerror = function (evt) {
            GameLog.log('Socket onerror...');
            var eventName = CUSTOM_EVENT_GAME_SOCKET_ON_ERROR;
            if (self._socketType === SOCKET_TYPE_SELECT_SERVER) {
                eventName = CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_ERROR;
            }

            var event = new cc.EventCustom(eventName);
            cc.eventManager.dispatchEvent(event);
        };

        //关闭socket
        this._socket.onclose = function (evt) {
            GameLog.log('Socket onclose...');
            self._isConnected = false;

            var eventName = CUSTOM_EVENT_GAME_SOCKET_CLOSED;
            if (self._socketType === SOCKET_TYPE_SELECT_SERVER) {
                eventName = CUSTOM_EVENT_SELECT_SERVER_SOCKET_CLOSED;
            }
            ;
            var event = new cc.EventCustom(eventName);
            cc.eventManager.dispatchEvent(event);
        };
    },
    _cacheData: function (data) {
        if (this._cachedReceivedData === null) {
            this._cachedReceivedData = new ByteArray();
        }
        if (data !== undefined && data instanceof ArrayBuffer) {
            this._cachedReceivedData.writeBytes(data);
        }
    },
    /**
     * 解析协议数据
     */
    _parseProtocalData: function (data) {
        this._cacheData(data);
        /**
         * 判断接到的数据是否满足基本长度
         * "WIST"==>标识==>协议内容长度==>协议号==>协议内容
         * 如果数据长度(dataLength)小于12 ("WIST"、"标识"和"协议内容长度"三部分数据的长度(4+4+4))
         * 则不处理
         */
        var dataLength = this._cachedReceivedData.bytesLength();
        if (dataLength <= 12) {
            console.log("协议数据不完整不做解析!");
            return;
        }
        /**
         * 2,检查协议头
         */
        var receivedBuffer = this._cachedReceivedData.buffer();
        var receivedData = new ByteArray(receivedBuffer);
        var HEAD0 = receivedData.readByte();
        var HEAD1 = receivedData.readByte();
        var HEAD2 = receivedData.readByte();
        var HEAD3 = receivedData.readByte();
        if (HEAD0 !== 87 || HEAD1 !== 73 || HEAD2 !== 83 || HEAD3 !== 84) {
            console.log("错误的协议头");
            return;
        }
        /**
         * 3,检查协议长度
         */
        var commandId = receivedData.readInt();
        var contentLength = receivedData.readInt();
        var receivedLength = receivedData.bytesLength() - 12;
        if (receivedLength < contentLength) {
            GameLog.log("内容太短不做解析!");
            return;
        }
        var protId = receivedData.readInt();

        //解析协议数据
        var protData = receivedBuffer.slice(16, 16 + contentLength);
        GameProtocalUtil.getInstance().parseProtocal(commandId, protId, protData)
        //从缓存中删除该条协议数据
        var remainData = this._cachedReceivedData.slice(12 + contentLength);
        this._cachedReceivedData = new ByteArray(remainData);
        var remainDataLength = this._cachedReceivedData.bytesLength();

        //数据递归解析
        if (remainDataLength > 0) {
            this._parseProtocalData();
        }
    }
});