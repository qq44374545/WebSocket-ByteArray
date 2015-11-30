/**
 * Created by sbxfc on 2015/10/21.
 */

var __MAX_INTEGER_VALUE = 2147483647;
var SOCKET_REQUEST_TIME_OUT = 30000;

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
            _waitingCMDs: new Object(),
            /**
             * 发送协议
             */
            sendProt: function () {

                /**
                 * 解析发送数据里的协议和callback对象
                 */
                var pCallback = null;
                var prots = [];
                for (var i = 0; i < arguments.length; i++) {
                    var arg = arguments[i];
                    if (arg instanceof Prot) {
                        prots.push(arg);
                    }
                    else if (arg instanceof ProtCallBack) {
                        pCallback = arg;
                    } else if (typeof arg === 'function') {
                        pCallback = arg;
                    }
                }

                /**
                 * 生成协议的session
                 */
                var sessionId = parseInt(Math.random() * __MAX_INTEGER_VALUE);
                while (this._waitingCMDs[sessionId] !== undefined && this._waitingCMDs[sessionId] !== null) {
                    sessionId = parseInt(Math.random() * __MAX_INTEGER_VALUE);
                }

                /**
                 * 构建Sender并发送协议
                 */
                var sender = new Sender(sessionId, prots, pCallback);
                sender.doSend();

                /**
                 * 设置协议回调函数
                 */
                this._waitingCMDs[sessionId] = sender;
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
                        case 1001:
                            return new Prot1001();
                        default :
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
                        GameLog.log(error);
                    }
                    else {
                        prot.doProtocal(bytes);
                    }
                    this._prots[prot.protId] = prot
                }
            },
            /**
             * 解析服务器返回的游戏协议
             * sessionId 为-1是服务器推送的协议
             */
            parseProtocal: function (sessionId, protId, data) {
                var prot = null;
                var sender = null;
                if (sessionId !== -1) {
                    sender = this._waitingCMDs[sessionId];
                    if (sender) {
                        prot = sender.getProt(protId);
                    }
                }

                //解析协议
                if (!prot) {
                    prot = GameProtocalUtil.getInstance().getProt(protId);
                }
                this.decodeProt(prot, data);

                //处理回调函数
                if (sender) {
                    if (sender.protsCount() <= 1) {
                        this._waitingCMDs[sessionId] = null;
                    }
                    sender.onCmmandFinshed(prot);
                }
            }
        };
    };


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
        this._timeOut = setTimeout(function () {
            console.log("==================>协议超时<======================");
        }, SOCKET_REQUEST_TIME_OUT);
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
            if (typeof callback === "function") {
                callback(prot);
            }
            else {
                this._pCallBack.onCmmandFinished(prot);
            }
        }

        clearTimeout(this._timeOut);
    },
    protsCount: function () {
        return this._prots.length;
    },
    getProt: function (protId) {
        var length = this._prots.length;
        for (var i = 0; i < length; i++) {
            var prot = this._prots[i];
            if (prot.protId === protId) {
                return prot;
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