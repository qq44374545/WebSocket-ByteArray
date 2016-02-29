/**
 * Created by sbxfc on 2015/10/21.
 */

var EVENT_SUCCESS = 1;
var EVENT_FAILURE = 2;

var __MAX_INTEGER_VALUE = 2147483647;
var SOCKET_REQUEST_TIME_OUT = 30000;
var GAME_PROTOCAL_MIN_PERIOD = 500;//协议的最小间隔时间

/**
 * 如果GameProtocalUtil.sendProt传入callback对象是继承此类的子类,
 * 协议成功后会自动调用onCmmandFinished函数
 */
var ProtCallBack = cc.Class.extend({
    onCmmandFinished: function (pProt) {
        console.log("onCmmandFinished");
    }
});

/**
 * 协议管理类
 */
var GameProtocalUtil = (function () {
    var instance = null;

    function getGameProtocalUtil() {
        return {
            _prots: [],
            _protsSendTime: new Object(),//记录协议最后的发送时间
            _protsCached: [],//缓存的未发送协议
            _reSendCDTimer: null,
            _waitingCMDs: {},
            _waitingPushCMDs: {},
            /**
             * 发送协议
             */
            sendProt: function () {
                var prots = [];
                var cb = null;
                for (var i = 0; i < arguments.length; i++) {
                    var arg = arguments[i];
                    if (arg instanceof Prot) {
                        prots.push(arg);
                    }
                    else if (arg instanceof ProtCallBack) {
                        cb = arg;
                    }
                    else if (typeof arg === 'function') {
                        cb = arg;
                    }
                }

                this._send(prots, cb);
            },
            /**
             * 创建一个倒计时重发协议的定时器
             */
            _setResendCDTimer: function () {
                if (this._reSendCDTimer) {
                    clearTimeout(this._reSendCDTimer);
                    this._reSendCDTimer = null;
                }
                GameLog.log("设置协议重发倒计时!");
                this._reSendCDTimer = setTimeout(this._sendTheCacheProts.bind(this), GAME_PROTOCAL_MIN_PERIOD);
            },
            /**
             * 生成一个协议Key
             */
            _generateSessionKey: function () {
                var sessionId = parseInt(Math.random() * __MAX_INTEGER_VALUE);
                while (this._waitingCMDs[sessionId] !== undefined && this._waitingCMDs[sessionId] !== null) {
                    sessionId = parseInt(Math.random() * __MAX_INTEGER_VALUE);
                }
                return sessionId;
            },
            /**
             * 发送协议
             */
            _send: function (prots, pCallback) {

                var key = this._getProtsKey(prots);

                //检查协议是否频繁发送
                if (this._isFrequentlySend(key)) {
                    GameLog.log("协议频繁发送!");
                    //缓存该协议
                    this._cacheTheSendProts(key, prots, pCallback);
                    //重新发送协议
                    this._setResendCDTimer();
                    return;
                }

                /**
                 * 构建Sender并发送协议
                 */
                var sessionId = this._generateSessionKey();
                var sender = new Sender(sessionId, prots, pCallback);
                sender.doSend();

                /**
                 * 混存最后发送时间
                 */
                this._cacheLastSendTime(key);

                /**
                 * 设置协议回调函数
                 */
                this._waitingCMDs[sessionId] = sender;
            },
            /**
             * 获取多条协议的唯一Key值
             */
            _getProtsKey: function (prots) {
                var key = "";
                if (prots instanceof Prot) {
                    key = prots.protId.toString();
                }
                else {
                    for (var k in prots) {
                        if (key !== "") {
                            key += ",";
                        }
                        key += prots[k].protId;
                    }
                }
                return key;
            },
            /**
             * 发送缓存的协议
             */
            _sendTheCacheProts: function () {
                GameLog.log("重新发送缓存的协议!");
                var length = this._protsCached.length;
                if (length > 0) {
                    var data = this._protsCached.shift();
                    this._send(data.prots, data.cb);

                    if (length > 1) {
                        this._setResendCDTimer();
                    }
                }
            },
            /**
             * 缓存因超时未发送的协议
             */
            _cacheTheSendProts: function (key, prots, callback) {
                GameLog.log("缓存协议!");
                var data = {prots: prots, cb: callback}
                this._protsCached.push(data);
                return true;
            },
            /**
             * 记录协议的最后发送时间
             */
            _cacheLastSendTime: function (key) {
                this._protsSendTime[key] = new Date();
                return true;
            },
            /**
             * 检查协议是否频繁发送
             */
            _isFrequentlySend: function (protsKey) {
                var lastTime = this._protsSendTime[protsKey];
                if (lastTime) {
                    var now = new Date();
                    if (now.getTime() - lastTime.getTime() < GAME_PROTOCAL_MIN_PERIOD) {
                        GameLog.log("协议频繁发送");
                        return true;
                    }
                }
                return false;
            },
            /**
             * 设置推送协议
             */
            setPushProt: function () {

                /**
                 * 解析发送数据里的协议和callback对象
                 */
                var pCallback = null;
                var pProt = null;
                for (var i = 0; i < arguments.length; i++) {
                    var arg = arguments[i];
                    if (arg instanceof Prot) {
                        pProt = arg;
                    }
                    else if (arg instanceof ProtCallBack) {
                        pCallback = arg;
                    } else if (typeof arg === 'function') {
                        pCallback = arg;
                    }
                }

                /**
                 * 设置协议回调函数
                 */
                var cmd = pProt.protId;

                /**
                 * 构建Sender
                 */
                var sender = new Sender(cmd, pProt, pCallback);

                /**
                 * 设置协议回调函数
                 */
                this._waitingPushCMDs[cmd] = sender;
            },
            getProt: function (protId, isSelectServerProt) {
                if (typeof protId !== "number") {
                    return null;
                }
                isSelectServerProt = isSelectServerProt === undefined ? false : isSelectServerProt;

                if (isSelectServerProt === false) {

                    //从缓存中取该协议
                    if (this._prots && this._prots[protId] !== undefined && this._prots[protId] !== null) {
                        return this._prots[protId];
                    }

                    switch (protId) {
                        case 4001:
                            return new Prot4001();
                        default :
                            GameLog.log("协议:" + protId + "未制定！")
                            return null;
                    }
                }
                else {

                }
            },
            /**
             *
             */
            decodeProt: function (prot, data) {
                if (prot !== undefined && prot !== null) {
                    var bytes = new ByteArray(data);
                    prot.stateCode = bytes.readByte();
                    if (prot.stateCode === PROT_STATE_CODE_FAILED) {
                        var error = bytes.readUTF();
                        prot.errorMsg = error;
                        GameLog.log(error);
                        if (__toastManager) {
                            __toastManager.show(error);
                        }
                        return false;
                    }
                    else {
                        try {
                            prot.doProtocal(bytes);
                        } catch (e) {

                            //清除协议缓存
                            this.cleanProtocalCache();

                            var errorMsg = "协议解析错误,协议号:" + prot.protId;
                            throw Error(errorMsg);
                        }
                    }
                    this._prots[prot.protId] = prot
                }

                return true;
            },
            /**
             * 清空缓存的数据
             */
            cleanProtocalCache: function () {
                GameSocket.getInstance().cleanTheCache();
            },
            _getSender: function (sessionId) {
                if (sessionId === -1) {
                    return null;
                }
                return this._waitingCMDs[sessionId];
            },
            /**
             * 解析服务器返回的游戏协议
             * @param sessionId 若为-1,则意为服务器推送的协议
             */
            parseProtocal: function (sessionId, protId, data) {

                var prot = null;
                var sender = null;
                var pushSender = null;
                if(sessionId === -1){
                    pushSender = this._waitingPushCMDs[protId];
                    prot = pushSender.getProt(protId);
                }
                else{
                    sender = this._getSender(sessionId);
                    prot = sender.getProt(protId);
                }

                if(!prot){
                    prot = GameProtocalUtil.getInstance().getProt(protId);
                }
                if(prot){
                    var status = this.decodeProt(prot, data);
                    if (status) {
                        if (sender) {
                            if (sender.protsCount() <= 1) {
                                this._waitingCMDs[sessionId] = null;
                            }
                            sender.onCmmandFinshed(prot);
                        }
                        else if (pushSender) {
                            pushSender.onPushCmmandFinshed(prot);
                        }
                    }
                    else {//协议解析失败
                        this._waitingCMDs[sessionId] = null;
                        sender = null;
                    }
                }
            }
        };
    }

    return {
        getInstance: function () {
            if (instance === null) {
                instance = getGameProtocalUtil();
            }
            return instance;
        }
    };
})();

var Sender = cc.Class.extend({
    _sessionId: -1,
    _pCallBack: null,  //回调函数
    _prots: null,      //发送的协议
    _timeOut: null,    //超时处理
    ctor: function (sessionId, prots, pCallBack) {
        this._sessionId = sessionId;
        this._prots = prots;
        this._pCallBack = pCallBack;
    },

    /**
     * 向指定的服务器发送套接字数据
     */
    doSend: function () {
        var data = new ByteArray();
        if (this._prots instanceof Array) {
            var length = this._prots.length;
            for (var i = 0; i < length; i++) {
                var prot = this._prots[i];
                var bytes = prot.getCommand();
                var protData = this._packageProtData(prot.protId, bytes.buffer(), this._sessionId);
                data.writeBytes(protData.buffer());
            }
        }
        else if (this._prots instanceof Prot) {
            var prot = this._prots;
            var bytes = prot.getCommand();
            var protData = this._packageProtData(prot.protId, bytes.buffer(), this._sessionId);
            data.writeBytes(protData.buffer());
        }

        GameSocket.getInstance().sendProt(data.buffer());
        this._startRequestTime();
    },
    _startRequestTime: function () {
        var self = this;
        this._timeOut = setTimeout(function () {
            GameLog.log("==================>协议超时<======================");
            if (self._prots instanceof Array) {
                for (var i = 0; i < self._prots.length; i++) {
                    var prot = self._prots[i];
                    GameLog.log("->协议" + prot.protId + "超时");
                }
            } else if (self._prots instanceof Prot) {
                GameLog.log("->协议" + self._prots.protId + "超时");
            }
        }, SOCKET_REQUEST_TIME_OUT);
    },
    /**
     * 推送协议完成
     */
    onPushCmmandFinshed: function (prot) {
        var callback = this._pCallBack;
        if (callback) {
            if (typeof callback === "function") {
                callback(prot);
            }
            else {
                this._pCallBack.onCmmandFinished(prot);
            }
        }

    },
    onCmmandFinshed: function (prot) {
        if (Array.isArray(this._prots) && this._prots.length > 1) {
            var idx = this._prots.indexOf(prot);
            if (idx !== -1) {
                this._prots.splice(idx, 1);
            }
            return;
        }

        if (prot instanceof Prot) {
            var callback = this._pCallBack;
            if (callback) {
                if (typeof callback === "function") {
                    callback(prot);
                }
                else {
                    this._pCallBack.onCmmandFinished(prot);
                }
            }

        }

        clearTimeout(this._timeOut);
    },
    protsCount: function () {
        return this._prots.length;
    },
    /**
     * 根据协议号获取协议对象
     */
    getProt: function (protId) {
        if (this._prots instanceof Array) {
            var length = this._prots.length;
            for (var i = 0; i < length; i++) {
                var prot = this._prots[i];
                if (prot.protId === protId) {
                    return prot;
                }
            }
        }
        else if (this._prots instanceof Prot) {
            if (this._prots.protId === protId) {
                return this._prots;
            }
        }

        return null;
    },
    _packageProtData: function (protId, data, sessionId) {
        var bytes = new ByteArray();
        //写入“WIST”四个字符
        bytes.writeByte(87);//'W'=87
        bytes.writeByte(73);//'I'=73
        bytes.writeByte(83);//'S'=83
        bytes.writeByte(84);//'T'=84
        //写入协议等待标识
        bytes.writeInt(sessionId);
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
});