/*
 *  DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *  Version 2, December 2004
 *
 *  Copyright (C) 2013-2015 sbxfc rungame.me
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
var CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_MESSAGE = "custom_event_select_server_socket_on_message";
var CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_ERROR = "custom_event_select_server_socket_on_error";
var CUSTOM_EVENT_SELECT_SERVER_SOCKET_CLOSED = "custom_event_select_server_socket_closed";

var CUSTOM_EVENT_GAME_SOCKET_ON_OPEN = "custom_event_game_socket_on_open";
var CUSTOM_EVENT_GAME_SOCKET_ON_MESSAGE = "custom_event_game_socket_on_message";
var CUSTOM_EVENT_GAME_SOCKET_ON_ERROR = "custom_event_game_socket_on_error";
var CUSTOM_EVENT_GAME_SOCKET_CLOSED = "custom_event_game_socket_closed";

var SOCKET_TYPE_GAME = 0;
var SOCKET_TYPE_SELECT_SERVER = 1;

var SocketUtils = (function(){
    return{
        getProtPackage:function(protId,data,protTag){
            var bytes = new ByteArray();
            //写入“WIST”四个字符
            bytes.writeByte(87);//'W'=87
            bytes.writeByte(73);//'I'=73
            bytes.writeByte(83);//'S'=83
            bytes.writeByte(84);//'T'=84
            //写入协议等待标识
            GameLog.log("发送协议标识:"+protTag.toString())
            bytes.writeInt(protTag);
            //写入协议数据长度
            var protIdLength = 4;//32位整形长度为4
            var dataLength = protIdLength + data.byteLength;
            bytes.writeInt(dataLength);//协议号长度+协议内容长度
            //写入协议ID
            bytes.writeInt(protId);//协议ID
            //写入协议数据
            bytes.writeBytes(data);//协议数据
            return bytes;
        }
    };
})();

var IOSocket  = cc.Class.extend({
    socket: null,
    socketType:0,
    isInit: false,
    initNetwork: function (host,type) {

        if (typeof host === undefined || typeof host !== "string"){
            GameLog.log("Socket 地址错误!");
            return;
        }

        GameLog.log('Network initSocket...');
        this.host = host;
        this.socket = new WebSocket(this.host);
        this.socket.socketType = type === undefined ? SOCKET_TYPE_GAME : type;
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = function (evt) {
            GameLog.log('Network onopen...');
            this.isInit = true;

            //socket连接成功
            var eventName =  CUSTOM_EVENT_GAME_SOCKET_ON_OPEN;
            if(this.socketType === SOCKET_TYPE_SELECT_SERVER){
                eventName = CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_OPEN;
            };
            var event = new cc.EventCustom(eventName);
            cc.eventManager.dispatchEvent(event);
        };

        //收到服务器消息
        this.socket.onmessage = function (evt) {
            GameLog.log('Network onmessage...');
            GameLog.log("接收到的数据格式为:"+evt.data.toString());

            var data = null;
           /* if(evt.data instanceof Blob){
                var fd = new FileReader();
                fd.readAsArrayBuffer(data);
                fd.onload = function (e) {
                    //读取成功后得到ArrayBuffer
                    data = e.target.result;
                };
            }*/

            if (evt.data instanceof ArrayBuffer){
                data = evt.data;
            }
            else{
                GameLog.log("接收到的数据格式为:"+(typeof evt.data));
            }

            if(data !== null) {
                var eventName = CUSTOM_EVENT_GAME_SOCKET_ON_MESSAGE;
                if (this.socketType === SOCKET_TYPE_SELECT_SERVER) {
                    eventName = CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_MESSAGE;
                }
                ;
                var event = new cc.EventCustom(eventName);
                event.setUserData(data);
                cc.eventManager.dispatchEvent(event);
            }
        };

        //报错
        this.socket.onerror = function (evt) {
            GameLog.log('Network onerror...:'+evt);
            var eventName =  CUSTOM_EVENT_GAME_SOCKET_ON_ERROR;
            if(this.socketType === SOCKET_TYPE_SELECT_SERVER){
                eventName = CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_ERROR;
            };
            var event = new cc.EventCustom(eventName);
            cc.eventManager.dispatchEvent(event);
        };

        //关闭socket
        this.socket.onclose = function (evt) {
            GameLog.log('Network onclose...');
            this.isInit = false;

            var eventName =  CUSTOM_EVENT_GAME_SOCKET_CLOSED;
            if(this.socketType === SOCKET_TYPE_SELECT_SERVER){
                eventName = CUSTOM_EVENT_SELECT_SERVER_SOCKET_CLOSED;
            };
            var event = new cc.EventCustom(eventName);
            cc.eventManager.dispatchEvent(event);
        };
    },
    //发送数据
    send: function (data) {
        if (this.isInit) {
            GameLog.log('Network is not inited...');
        } else if (this.socket.readyState == WebSocket.OPEN) {
            GameLog.log('发送内容长度:' + data.byteLength);
            this.socket.send(data);
        } else {
            GameLog.log('Network WebSocket readState:' + this.socket.readyState);
        }
    },
    close: function () {
        if (this.socket) {
            GameLog.log("Network close...");
            this.socket.close();
            this.socket = null;
        }
    }
});