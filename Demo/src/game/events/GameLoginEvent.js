/**
 * Created by sbxfc on 2015/10/22.
 */

var GameLoginEvent = ProtCallBack.extend({
    _userId:null,
    _userName:null,
    login:function(userId,userName){
        this._userId = userId === undefined ? 241:userId;
        this._userName = userName === undefined ? "1505271000000358872":userId;
        this._loginGame();
    },

    /**
     * 登陆游戏服务器
     */
    _loginGame:function(){
        var prot4001 = GameProtocalUtil.getInstance().getProt(4001);
        prot4001.setArgs(this._userId,this._userName);
        GameProtocalUtil.getInstance().sendProt(prot4001,this);
    },

    /**
     *  协议处理
     */
    onCmmandFinished:function(pProt)
    {
        switch (pProt.protId){
            case 4001:
            {
                switch (pProt.stateCode) {
                    case PROT_STATE_CODE_SUCC:
                        console.log("游戏登陆成功!");
                        break;
                    case 2://创建角色
                        console.log("创建角色!");
                        break;
                    case 3://排队
                        console.log("排队!");
                        break;
                    default :
                        console.log("登陆失败:"+pProt.stateCode.toString());
                        break;
                }
            }
                break;
        }
    }
});