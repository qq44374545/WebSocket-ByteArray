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

var SOCKET_EVENT_CONNECTED = "CUSTOM_EVENT_CONNECTED";
var SOCKET_EVENT_ERROR = "SOCKET_EVENT_ERROR";
var SOCKET_EVENT_CLOSED = "SOCKET_EVENT_CLOSED";
var SOCKET_EVENT_ONDATA = "SOCKET_EVENT_ONDATA";

var SocketStatus = {
    UNCONNECTED: -1,//未连接
    CONNECTING: 0,//正在连接
    CONNECTED: 1,//连接成功
};
var IOSocket = function () {
    var _host;
    /*对端的主机地址*/
    var _socket;
    /*套接字ID*/
    var _socketType;
    /*套接字类型*/
    var _status = -1;
    var _cache = null;
    /*接收到的数据缓存*/

    this.initNetwork = function (host) {
        this._host = host;
        this._status = SocketStatus.CONNECTING;
        this.connect();
    }.bind(this)


    this.send = function (data) {
        if (!this._socket) {
            console.log('WebSocket uninitialized...');
            return false;
        }

        if (this._status === SocketStatus.UNCONNECTED) {
            console.log('WebSocket is unconnected...');
        }
        else if (this._socket.readyState == WebSocket.OPEN) {
            this._socket.send(data);
            return true;
        }
        else {
            console.log('WebSocket readState:' + this._socket.readyState);
        }
        return false;
    };

    this.connect = function () {
        console.log("WebSocket connecting...");
        this._socket = new WebSocket(this._host);
        this._socket.binaryType = "arraybuffer";

        this._socket.onopen = function (evt) {
            console.log('WebSocket is connected!');
            this._status = SocketStatus.CONNECTED;
            this._dispatchEvent(SOCKET_EVENT_CONNECTED);
        }.bind(this);

        this._socket.onmessage = function (evt) {
            if (evt.data instanceof ArrayBuffer) {
                this._dispatchEvent(SOCKET_EVENT_ONDATA, evt.data);
            }
            else {
                console.log("WebSocket get typeof" + (typeof evt.data));
            }
        }.bind(this);

        this._socket.onerror = function (evt) {
            console.log('Websocket onerror...');
            this._status = SocketStatus.UNCONNECTED;
            this._dispatchEvent(SOCKET_EVENT_ERROR);
        }.bind(this);

        this._socket.onclose = function (evt) {
            console.log('Websocket onclose...');
            this._status = SocketStatus.UNCONNECTED;
            this._dispatchEvent(SOCKET_EVENT_CLOSED);
        }.bind(this);
    };


    this.close = function () {
        if (this._socket) {
            console.log("Websocket close...");
            this._status = SocketStatus.UNCONNECTED;
            this._socket.close();
            this._socket = null;
        }
    };

    /**
     * 抛出事件
     */
    this._dispatchEvent = function (type, data) {
        data = data === undefined ? {} : data;
        var evt = new CustomEvent(type);
        evt.data = data;
        window.dispatchEvent(evt);
    }.bind(this);
};


