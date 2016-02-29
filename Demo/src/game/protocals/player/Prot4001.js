/**
 * Created by sbxfc on 16/2/29.
 */

var Prot4001 = Prot.extend({

    //private
    _userID: null,
    _clientVersion: null,
    _platform: null,
    _channel: null,
    _language: null,
    _wst: null,
    _installID: null,


    ctor: function () {
        this._super();
        this.protId = 4001;
    },

    setArgs: function (userID, wst) {
        this._userID = userID;
        this._wst = wst;
        this._clientVersion = 100;
        this._platform = cc.sys.os;
        this._channel = "123456789";
        this._language = cc.sys.language;
        this._installID = "test";
    },

    getCommand: function () {
        var bytes =this._super();
        bytes.writeUTF(this._userID.toString());
        bytes.writeInt(this._clientVersion);
        bytes.writeUTF(this._platform);
        bytes.writeUTF(this._channel);
        bytes.writeUTF(this._language);
        bytes.writeUTF(this._wst);
        bytes.writeUTF(this._installID);
        return bytes;
    },

    doProtocal: function (bytes) {
        if (this.stateCode === PROT_STATE_CODE_SUCC) {
            //
        }
    }
});