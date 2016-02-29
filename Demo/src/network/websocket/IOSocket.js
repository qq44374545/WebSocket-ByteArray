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

/**
 * 协议基本长度,这一部本包括4个byte类型的头信息,一个整形的session id 以及 整形的协议内容长度
 * 这一部分的长度为12
 */
var PROTOCAL_BASIC_SIZE = 12;
var IOSocket = cc.Class.extend({
    _socket: null,
    _host: null,
    _socketType: 0,
    _isConnected: false,
    _receivedData: null,
    isReconnect: false,//重新连接服务器
    initNetwork: function (host, type) {

        GameLog.log('Socket初始化');

        this.isReconnect = false;
        this._host = host;
        this._socketType = type === undefined ? SOCKET_TYPE_GAME : type;
        this.connect();
    },
    /**
     * 发送数据
     */
    send: function (data) {
        if (!this._socket) {
            GameLog.log('Socket is not connect...');
            return false;
        }

        if (!this._isConnected) {
            GameLog.log('Socket is not connect...');
        }
        else if (this._socket.readyState == WebSocket.OPEN) {
            this._socket.send(data);
            return true;
        }
        else {
            GameLog.log('WebSocket readState:' + this._socket.readyState);
        }
        return false;
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
        this._receivedData = new ByteArray();
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
                if (data !== null) {
                    self._protocalParse(data);
                }
            }
            else {
                GameLog.log("接收到的数据格式为:" + (typeof evt.data));
            }
        };
        //socket报错
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
            var event = new cc.EventCustom(eventName);
            cc.eventManager.dispatchEvent(event);
        };
    },
    _cacheProtData: function (data) {
        if (this._receivedData === null) {
            this._receivedData = new ByteArray();
        }
        if (data && data instanceof ArrayBuffer) {
            this._receivedData.writeBytes(data);
        }
    },
    /**
     * 清空缓存
     */
    cleanTheCache: function () {
        this._cleanupCacheData();
    },
    /**
     * 协议数据解析,需要注意的是TCP协议有可能将服务器返回的协议分段返回
     * @param data 原始的二进制数据
     */
    _protocalParse: function (data) {

        this._cacheProtData(data);

        /**
         * 判断接到的数据是否满足基本长度,如果数据不满足基本长度,则不处理.
         * 基本长度 = "WIST" + session id + 协议长度 = 1*4 + 4 + 4
         */
        var size = this._receivedData.bytesLength();
        if (size <= PROTOCAL_BASIC_SIZE) {
            console.log("不解析!");
            return;
        }
        /**
         * 2,检查协议头
         */
        var buffer = this._receivedData.buffer();
        var bytes = new ByteArray(buffer);
        var HEAD0 = bytes.readByte();
        var HEAD1 = bytes.readByte();
        var HEAD2 = bytes.readByte();
        var HEAD3 = bytes.readByte();
        if (HEAD0 !== 87 || HEAD1 !== 73 || HEAD2 !== 83 || HEAD3 !== 84) {
            throw Error("错误的协议头!");
            return;
        }
        /**
         * 3,检查协议长度
         */
        var sessionId = bytes.readInt();
        var protocalSize = bytes.readInt();
        var protocalRealSize = bytes.bytesLength() - PROTOCAL_BASIC_SIZE;
        if (protocalRealSize < protocalSize) {
            GameLog.log("协议未接完整,不处理!");
            return;
        }

        //读取协议号
        var protID = bytes.readInt();

        //获取协议数据
        var index = PROTOCAL_BASIC_SIZE + 4;
        var protContent = buffer.slice(index, index + protocalSize);
        GameProtocalUtil.getInstance().parseProtocal(sessionId, protID, protContent);

        var remainData = this._receivedData.slice(PROTOCAL_BASIC_SIZE + protocalSize);
        this._receivedData = new ByteArray(remainData);
        var remainSize = this._receivedData.bytesLength();
        if (remainSize > 0) {
            this._protocalParse();
        }
    }
});