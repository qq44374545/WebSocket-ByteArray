var Prot1001 = Prot.extend(
{
    _userId: null,
    _userName: null,
    _clientVersion: null,
    _platform: null,
    _channel: null,
    _language: null,
    _appKey: null,
    _wst: null,
    _installId: null,
    ctor: function () {
        this._super();
        this.protId = 1001;
    },
    setArgs: function (userId, userName, clientVersion, platform, channel, language, appKey, wst, installId) {
        this._userId = userId;
        this._userName = userName;
        this._clientVersion = clientVersion;
        this._platform = platform;
        this._channel = channel;
        this._language = language;
        this._appKey = appKey;
        this._wst = wst;
        this._installId = installId;
    },
    getCommand: function () {
        var bytes = new ByteArray();
        bytes.writeLong(this._userId);
        bytes.writeUTF(this._userName);
        bytes.writeInt(this._clientVersion);
        bytes.writeUTF(this._platform);
        bytes.writeUTF(this._channel);
        bytes.writeUTF(this._language);
        bytes.writeUTF(this._appKey);
        bytes.writeUTF(this._wst);
        bytes.writeUTF(this._installId);
        return bytes;
    },

    /**
     * 协议解析
     */
    doProtocal: function (bytes) {
        if (this.stateCode === 1) {

        }
    }
});