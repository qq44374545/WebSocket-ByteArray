/**
 * Created by sbxfc on 2015/10/22.
 */

var GameLoginEvent = ProtCallBack.extend({

    /**
     * 登陆游戏
     */
    _userId:null,
    _userName:null,
    login:function(userId,userName){
        this._userId = userId;
        this._userName = userName;
        this._logingame();
    },

    /**
     * 登陆游戏服务器
     */
    _logingame:function(){
        var prot1001 = GameProtocalUtil.getInstance().getProt(1001);
        prot1001.setArgs(this._userId,this._userName,"wst_0201006","zh","d01503944c714920a8096d4581ad6081","","","","");
        GameProtocalUtil.getInstance().sendProt(prot1001,this);
    },

    /**
     *  协议处理
     */
    onCmmandFinished:function(pProt)
    {
        switch (pProt.protId){
            case 1001:
            {
                switch (pProt.stateCode) {
                    case PROT_STATE_CODE_SUCC:
                    {
                        console.log("游戏登陆成功!");
                    }
                        break;
                    case 2://创建角色
                        console.log("创建角色!");
                        break;
                    case 3://排队
                        console.log("排队!");
                        break;
                    default :
                    {
                        console.log("游戏登陆失败!:"+pProt.stateCode.toString());
                    }
                        break;
                }
            }
                break;
        }
    }
});