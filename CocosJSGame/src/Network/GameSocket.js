/**
 * Created by sbxfc on 2015/10/13.
 */

var SELECT_SERVER_ADDRESS = "ws://192.168.1.214:8083";//选服服务器地址
var GAME_SERVER_ADDRESS = "ws://192.168.1.214:8083";//服务器地址

var SelectServerSocket  = (function(){
    var instance = null;
    function getNetworkInstance (){
        var networkInstance;
        networkInstance = {
            _socket: null,
            _isConnected:false,
            //初始化联网
            initNetwork: function () {
                var self = this;
                this._socket = new IOSocket();
                this._socket.initNetwork(SELECT_SERVER_ADDRESS,SOCKET_TYPE_SELECT_SERVER);

                //监听联socket网成功事件
                var listener = cc.EventListener.create({
                    event: cc.EventListener.CUSTOM,
                    eventName: CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_OPEN,
                    callback: function(event){
                        //socket连接成功!
                        GameLog.log("连接选服服务器成功!");
                        self._isConnected = true;
                    }
                });
                cc.eventManager.addListener(listener, 1);

                //收到信息
                var onMessageEventListener = cc.EventListener.create({
                    event: cc.EventListener.CUSTOM,
                    eventName: CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_MESSAGE,
                    callback: function(event){
                        // 可以通过getUserData来设置需要传输的用户自定义数据
                        event.stopPropagation();
                        if(event.getUserData())
                        {
                            var data = event.getUserData();
                            if(Array.isArray(data) && data.length === 4){
                                var protId = data[0];
                                var protBuffer = data[1];
                                var commandId = data[2];
                                var waitData = data[3];
                                GameProtocals.dispatchData(SOCKET_TYPE_SELECT_SERVER,protId,protBuffer,commandId,waitData);
                            }
                        }
                    }
                });
                cc.eventManager.addListener(onMessageEventListener, 1);

                /**
                 * 处理协议返回数
                 */

            },
            /**
             * 发送条协议消息
             * @param prots 协议数组[{协议1id:协议1数据},{协议2id:协议2数据},{协议3id:协议3数据}]
             * @param commandId 协议标识,用来定位协议返回时的对应处理函数(默认指为-1)
             * @param waitData 等待数据,处理函数需要的额外信息
             */
            send:function(prots,commandId,waitData){
                this._socket.send(prots,commandId,waitData);
            },
            /**
             * 发送一条协议消息
             * @param protId 协议ID
             * @param data 协议数据
             * @param commandId 协议标识,用来定位协议返回时的对应处理函数(默认指为-1)
             * @param waitData 等待数据,commandId,处理函数需要的额外信息
             */
            sendProt: function (protId,data,commandId,waitData) {
                data = data === undefined ? new ArrayBuffer():data;
                commandId = commandId === undefined ? -1 : commandId;
                this._socket.sendProt(protId,data,commandId,waitData);
            },
            //关闭socket
            close: function () {
                this._socket.close();
                this._socket = null;
            }
        };
        return networkInstance;
    };


    return {
        getInstance:function(){
            if(instance === null){
                instance = getNetworkInstance();
            }
            return instance;
        }
    };
})();

var GameSocket  = (function(){
    var instance = null;
    function getNetworkInstance (){
        var networkInstance;
        networkInstance = {
            _socket: null,
            _isConnected:false,
            //初始化联网
            initNetwork: function () {
                var self = this;
                this._socket = new IOSocket();
                this._socket.initNetwork(GAME_SERVER_ADDRESS,SOCKET_TYPE_GAME);

                //监听联socket网成功事件
                var listener = cc.EventListener.create({
                    event: cc.EventListener.CUSTOM,
                    eventName: CUSTOM_EVENT_GAME_SOCKET_ON_OPEN,
                    callback: function(event){
                        //socket连接成功!
                        GameLog.log("连接游戏服务器成功!");
                        self._isConnected = true;
                    }
                });
                cc.eventManager.addListener(listener, 1);

                //收到信息
                var onMessageEventListener = cc.EventListener.create({
                    event: cc.EventListener.CUSTOM,
                    eventName: CUSTOM_EVENT_GAME_SOCKET_ON_MESSAGE,
                    callback: function(event){
                        // 可以通过getUserData来设置需要传输的用户自定义数据
                        event.stopPropagation();
                        if(event.getUserData())
                        {
                            var data = event.getUserData();
                            if(Array.isArray(data) && data.length === 4){
                                var protId = data[0];
                                var protBuffer = data[1];
                                var commandId = data[2];
                                var waitData = data[3];
                                GameProtocals.dispatchData(SOCKET_TYPE_GAME,protId,protBuffer,commandId,waitData);
                            }
                        }
                    }
                });
                cc.eventManager.addListener(onMessageEventListener, 1);

                /**
                 * 处理协议返回数
                 */

            },
            /**
             * 发送条协议消息
             * @param prots 协议数组[{协议1id:协议1数据},{协议2id:协议2数据},{协议3id:协议3数据}]
             * @param commandId 协议标识,用来定位协议返回时的对应处理函数(默认指为-1)
             * @param waitData 等待数据,处理函数需要的额外信息
             */
            send:function(prots,commandId,waitData){
                this._socket.send(prots,commandId,waitData);
            },
            /**
             * 发送一条协议消息
             * @param protId 协议ID
             * @param data 协议数据
             * @param commandId 协议标识,用来定位协议返回时的对应处理函数(默认指为-1)
             * @param waitData 等待数据,commandId,处理函数需要的额外信息
             */
            sendProt: function (protId,data,commandId,waitData) {
                data = data === undefined ? new ArrayBuffer():data;
                commandId = commandId === undefined ? -1 : commandId;
                this._socket.sendProt(protId,data,commandId,waitData);
            },
            //关闭socket
            close: function () {
                this._socket.close();
                this._socket = null;
            }
        };
        return networkInstance;
    };


    return {
        getInstance:function(){
            if(instance === null){
                instance = getNetworkInstance();
            }
            return instance;
        }
    };
})();