/**
 * Created by sbxfc on 2015/10/13.
 */

var SELECT_SERVER_HOST = "ws://192.168.1.214:8083";
var GAME_SERVER_HOST = "ws://192.168.1.214:8083";

var SelectServerSocket = (function () {
    var instance = null;

    function getNetworkInstance() {
        var networkInstance;
        networkInstance = {
            _socket: null,
            initNetwork: function () {
                if (this._socket !== null) {
                    this._socket.close();
                }
                this._socket = new IOSocket();
                this._socket.initNetwork(SELECT_SERVER_HOST, SOCKET_TYPE_SELECT_SERVER);
            },
            send: function (data) {
                this._socket.send(data);
            },
            close: function () {
                this._socket.close();
                this._socket = null;
            }
        };
        return networkInstance;
    };


    return {
        getInstance: function () {
            if (instance === null) {
                instance = getNetworkInstance();
            }
            return instance;
        }
    };
})();

var GameSocket = (function () {
    var instance = null;

    function getNetworkInstance() {
        var networkInstance;
        networkInstance = {
            _socket: null,
            //初始化联网
            initNetwork: function () {
                if (this._socket !== null) {
                    this._socket.close();
                }
                this._socket = new IOSocket();
                this._socket.initNetwork(GAME_SERVER_HOST, SOCKET_TYPE_GAME);
                this._addSocketListener();
            },
            sendProt: function (data) {
                this._socket.send(data);
            },
            //关闭socket
            close: function () {
                this._socket.close();
                this._socket = null;
            },
            _addSocketListener:function(){
                var self = this;
                var listener = cc.EventListener.create({
                    event: cc.EventListener.CUSTOM,
                    eventName: CUSTOM_EVENT_GAME_SOCKET_ON_OPEN,
                    callback: function (event) {
                        if (self._socket.isReconnect) {
                            GameLog.log("重连游戏服务器!");
                        }
                    }
                });
                cc.eventManager.addListener(listener, 1);
            }
        };
        return networkInstance;
    };


    return {
        getInstance: function () {
            if (instance === null) {
                instance = getNetworkInstance();
            }
            return instance;
        }
    };
})();