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
    _socketType:0,
    isInit: false,
    _waitingCMDsDic:null,
    _waitingDataDic:null,
    _cachedReceivedData:null,
    initNetwork: function (host,type) {
        if (typeof host !== "string"){
            GameLog.log("Socket 地址错误!");
            return;
        }
        var self = this;
        GameLog.log('Network initSocket...');
        this.host = host;
        this.socket = new WebSocket(this.host);
        this._socketType = type === undefined ? SOCKET_TYPE_GAME : type;
        this.socket.binaryType = "arraybuffer";

        //socket连接成功
        this.socket.onopen = function (evt) {
            GameLog.log('Network onopen...');
            this.isInit = true;

            var eventName =  CUSTOM_EVENT_GAME_SOCKET_ON_OPEN;
            if(self._socketType === SOCKET_TYPE_SELECT_SERVER){
                eventName = CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_OPEN;
            };
            var event = new cc.EventCustom(eventName);
            cc.eventManager.dispatchEvent(event);
        };

        //收到服务器消息
        this.socket.onmessage = function (evt) {
            GameLog.log("Network onmessage...数据格式为:"+evt.data.toString());

            var data = null;
            if(evt.data instanceof Blob){
                var fd = new FileReader();
                fd.readAsArrayBuffer(evt.data);
                fd.onload = function (e) {
                    //读取成功后得到ArrayBuffer
                    data = e.target.result;
                };
            }
            else if (evt.data instanceof ArrayBuffer){
                data = evt.data;
            }
            else{
                GameLog.log("接收到的数据格式为:"+(typeof evt.data));
            }

            if(data !== null) {
                self._responseHandler(data);
            }
        };

        //报错
        this.socket.onerror = function (evt) {
            GameLog.log('Network onerror...:'+evt);
            var eventName =  CUSTOM_EVENT_GAME_SOCKET_ON_ERROR;
            if(self._socketType === SOCKET_TYPE_SELECT_SERVER){
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
            if(self._socketType === SOCKET_TYPE_SELECT_SERVER){
                eventName = CUSTOM_EVENT_SELECT_SERVER_SOCKET_CLOSED;
            };
            var event = new cc.EventCustom(eventName);
            cc.eventManager.dispatchEvent(event);
        };
    },
    //发送数据
    send: function (prots,commandId,waitData) {
        if (this.isInit) {
            GameLog.log('Network is not inited...');
        } else if (this.socket.readyState == WebSocket.OPEN) {
            var protCount = 0;
            if(Array.isArray(prots)){
                var totalBytes = new ByteArray();
                for(var i = 0; i<prots.length;i++){
                    var prot = prots[i];
                    if(prot.length == 2){
                        var protId = prot[0];
                        var data = prot[1];
                        this._setWaitCMD(commandId,protId,waitData);
                        var bytes = SocketUtils.getProtPackage(protId,data.buffer(),commandId);
                        totalBytes.writeBytes(bytes.buffer());
                        protCount++;
                    }
                }
                if(totalBytes.bytesLength() > 0){
                    var bytes = new ByteArray();
                    bytes.writeByte(protCount);
                    GameLog.log('发送协议数量:' + protCount);
                    bytes.writeBytes(totalBytes.buffer());
                    GameLog.log('发送内容长度:' + totalBytes.bytesLength());
                    this.socket.send(bytes.buffer());
                }
            }
        } else {
            GameLog.log('Network WebSocket readState:' + this.socket.readyState);
        }
    },
    //发送数据
    sendProt: function (protId,data,commandId,waitData) {
        if (this.isInit) {
            GameLog.log('Network is not inited...');
        } else if (this.socket.readyState == WebSocket.OPEN) {
            this._setWaitCMD(commandId,protId,waitData);
            var packageBytes = SocketUtils.getProtPackage(protId,data,commandId);
            var bytes = new ByteArray();
            bytes.writeByte(1);
            GameLog.log('发送协议数量:' + 1);
            bytes.writeBytes(packageBytes.buffer());
            GameLog.log('发送内容长度:' + bytes.bytesLength());
            this.socket.send(bytes.buffer());
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
    },
    _responseHandler:function(data){

        if(this._cachedReceivedData === null){
            this._cachedReceivedData = new ByteArray();
        }

        if (data !== undefined){
            this._cachedReceivedData.writeBytes(data);
        }

        /**
         * 1,首先是判断接收数据的长度,协议数据的格式为("WIST"+标识+协议内容长度+协议号+协议内容)
         * 如果返回数据长度(responseDataLength)小于"WIST"、标识和协议长度三部分数据长度(4+4+4),则不处理
         */
        var dataLength = this._cachedReceivedData.bytesLength();
        if(dataLength <= 12){
            GameLog.log("协议数据不完整不做解析!");
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
        if(HEAD0 !== 87 || HEAD1 !== 73 || HEAD2 !== 83 || HEAD3 !== 84){
            GameLog.log("错误的协议头");
            return;
        }

        /**
         * 2,检查协议长度
         */
        var commandId = receivedData.readInt();
        var contentLength = receivedData.readInt();
        var receivedLength = receivedData.bytesLength()-12;
        if(receivedLength < contentLength){
            GameLog.log("内容太短不做解析!");
            return;
        }

        GameLog.log("协议标识 commandId:"+commandId.toString());

        var protId = receivedData.readInt();
        GameLog.log("协议号:"+protId.toString());

        /**
         * 解析协议数据
         */
        var protBuffer = receivedBuffer.slice(16,16+contentLength);
        var waitData = null;
        if(commandId != -1){
            var waitProts = this._waitingCMDsDic[commandId];
            GameLog.log("waitProts:"+waitProts.toString());
            if(Array.isArray(waitProts) && waitProts.length > 1){//这里应首先判断是不是一个数组
                var idx = waitProts.indexOf(protId);
                if(idx !== -1){
                    waitProts.splice(idx,1);
                    GameLog.log("waitProts:"+waitProts.toString());
                    this._waitingCMDsDic[commandId] = waitProts;
                }

                //重要
                commandId = -1;
            }
            else{
                waitData = this._waitingDataDic[commandId];

                this._waitingCMDsDic[commandId] = null;
                this._waitingDataDic[commandId] = null;
            }
        }


        var eventName =  CUSTOM_EVENT_GAME_SOCKET_ON_MESSAGE;
        if(this._socketType === SOCKET_TYPE_SELECT_SERVER){
            eventName = CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_MESSAGE;
        };
        var event = new cc.EventCustom(eventName);
        event.setUserData([protId,protBuffer,commandId,waitData]);
        cc.eventManager.dispatchEvent(event);

        /**
         *  从缓存中删除该条协议数据
         */
        var remainData = this._cachedReceivedData.slice(12+contentLength);
        this._cachedReceivedData = new ByteArray(remainData);
        var remainProtLength = this._cachedReceivedData.bytesLength();
        GameLog.log("未解析的协议长度为:"+remainProtLength.toString())

        if(remainProtLength > 0){
            this._cachedReceivedData();
        }
    }
    ,_setWaitCMD:function(commandId,protId,waitData){
        if(commandId !== -1){
            if(this._waitingDataDic === null){
                this._waitingDataDic = new Object();
            }
            this._waitingDataDic[commandId] = waitData;

            if(this._waitingCMDsDic === null){
                this._waitingCMDsDic = new Object();
            }


            if(this._waitingCMDsDic[commandId]){
                //等待标识对应了几个指令
                var waitProts = this._waitingCMDsDic[commandId];
                if(Array.isArray(waitProts)){
                    waitProts.push(protId);
                }
                else{
                    this._waitingCMDsDic[commandId] = [waitProts,protId];
                }
            }
            else{
                this._waitingCMDsDic[commandId] = protId;
            }
        }
    }
});