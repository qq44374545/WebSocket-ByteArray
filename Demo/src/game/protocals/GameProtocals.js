/**
 * Created by sbxfc on 2015/10/21.
 */

/**
 * 协议基类
 */
var PROT_STATE_CODE_SUCC = 1;
var PROT_STATE_CODE_FAILED = -1;
var Prot = cc.Class.extend({
    protId: -1,
    stateCode: -1,
    ctor: function () {
    },
    getCommand: function () {
        return new ByteArray();
    }
});


