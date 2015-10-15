/**
 * Created by sbxfc on 2015/10/13.
 */

//var SELECT_SERVER_ADDRESS = "ws://echo.websocket.org";//选服服务器地址
//var SELECT_SERVER_ADDRESS = "ws://192.168.1.105:8083";//选服服务器地址
var SELECT_SERVER_ADDRESS = "ws://192.168.1.105:8083";//选服服务器地址

var ServerSocket  = (function(){
    var _instance = null;
    function getNetworkInstance (){
        var _networkInstance;
        _networkInstance = {
            _socket: null,
            _isConnected:false,
            _waitingCMDsDic:null,
            _waitingDataDic:null,
            _cachedReceivedData:null,
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
                        GameLog.log("连接服务器成功!");
                        self._isConnected = true;
                    }
                });
                cc.eventManager.addListener(listener, 1);

                //监听收到信息事件
                var onMessageEventListener = cc.EventListener.create({
                    event: cc.EventListener.CUSTOM,
                    eventName: CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_MESSAGE,
                    callback: function(event){
                        // 可以通过getUserData来设置需要传输的用户自定义数据
                        event.stopPropagation();
                        if(event.getUserData())
                        {
                            responseHandler(event.getUserData());
                        }
                    }
                });
                cc.eventManager.addListener(onMessageEventListener, 1);

                /**
                 * 处理协议返回数
                 */
                var responseHandler = function(data){

                    if(self._cachedReceivedData === null){
                        self._cachedReceivedData = new ByteArray();
                    }

                    if (data !== undefined){
                        self._cachedReceivedData.writeBytes(data);
                    }

                    /**
                     * 1,首先是判断接收数据的长度,协议数据的格式为("WIST"+标识+协议内容长度+协议号+协议内容)
                     * 如果返回数据长度(responseDataLength)小于"WIST"、标识和协议长度三部分数据长度(4+4+4),则不处理
                    */
                    var dataLength = self._cachedReceivedData.bytesLength();
                    if(dataLength <= 12){
                        GameLog.log("协议数据不完整不做解析!");
                        return;
                    }

                    /**
                     * 2,检查协议头
                     */
                    var receivedBuffer = self._cachedReceivedData.buffer();
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
                        var waitProts = self._waitingCMDsDic[commandId];
                        GameLog.log("waitProts:"+waitProts.toString());
                        if(Array.isArray(waitProts) && waitProts.length > 1){//这里应首先判断是不是一个数组
                            var idx = waitProts.indexOf(protId);
                            if(idx !== -1){
                                waitProts.splice(idx,1);
                                GameLog.log("waitProts:"+waitProts.toString());
                                self._waitingCMDsDic[commandId] = waitProts;
                            }

                            //重要
                            commandId = -1;
                        }
                        else{
                            waitData = self._waitingDataDic[commandId];

                            self._waitingCMDsDic[commandId] = null;
                            self._waitingDataDic[commandId] = null;
                        }
                    }
                    GameProtocals.dispatchData(protId,protBuffer,commandId,waitData);

                    /**
                     *  从缓存中删除该条协议数据
                     */
                    GameLog.log("remain:"+self._cachedReceivedData.bytesLength())
                    var remainData = self._cachedReceivedData.slice(12+contentLength);
                    GameLog.log("remain:"+remainData.byteLength)
                    self._cachedReceivedData = new ByteArray(remainData);
                    GameLog.log("remain:"+self._cachedReceivedData.bytesLength())

                    responseHandler();
                }
            },
            /**
             * 发送条协议消息
             * @param prots 协议数组[{协议1id:协议1数据},{协议2id:协议2数据},{协议3id:协议3数据}]
             * @param commandId 协议标识,用来定位协议返回时的对应处理函数(默认指为-1)
             * @param waitData 等待数据,处理函数需要的额外信息
             */
            send:function(prots,commandId,waitData){
                //GameLog.log(prots.toString());
                if(Array.isArray(prots)){
                    var totalBytes = new ByteArray();
                    for(var i = 0; i<prots.length;i++){
                        var prot = prots[i];
                        if(prot.length == 2){
                            var protId = prot[0];
                            GameLog.log("协议ID:"+protId.toString())
                            var data = prot[1];
                            GameLog.log(data.bytesLength());
                            this._setWaitCMD(commandId,protId,waitData);
                            var bytes = SocketUtils.getProtPackage(protId,data.buffer(),commandId);
                            GameLog.log(bytes.bytesLength());
                            totalBytes.writeBytes(bytes.buffer());
                        }
                    }
                    if(totalBytes.bytesLength() > 0){
                        GameLog.log("发送的数据长度:"+totalBytes.bytesLength());
                        this._socket.send(totalBytes.buffer());
                    }
                }
            },
            /**
             * 发送一条协议消息
             * @param protId 协议ID
             * @param data 协议数据
             * @param commandId 协议标识,用来定位协议返回时的对应处理函数(默认指为-1)
             * @param waitData 等待数据,同waitTag,处理函数需要的额外信息
             */
            sendProt: function (protId,data,commandId,waitData) {
                if(data === undefined){
                    GameLog.error("协议数据为空");
                    return;
                }

                commandId = commandId === undefined ? -1 : commandId;

                this._setWaitCMD(commandId,protId,waitData);
                var bytes = SocketUtils.getProtPackage(protId,data,commandId);
                this._socket.send(bytes.buffer());
            },
            //关闭socket
            close: function () {
                this._socket.close();
                this._socket = null;
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
        };
        return _networkInstance;
    };


    return {
        getInstance:function(){
            if(_instance === null){
                _instance = getNetworkInstance();
            }
            return _instance;
        }
    };
})();