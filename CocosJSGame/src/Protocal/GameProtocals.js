/**
 * Created by sbxfc on 2015/10/13.
 */

var GameProtocals = (function(){
    var processWaitingCMDS = function (cmd,waitData){
        if(typeof cmd !== "number") return;
        switch(cmd){
            default :
                GameLog.log("=========================>WaitingCMD="+cmd.toString());
                break;
        }
    }
    return{
        dispatchData:function(protId,bytes,commandId,waitData){
            try{
                var ProtClass = eval("Prot"+protId.toString());
                if(ProtClass !== undefined){
                    var prot = new ProtClass();
                    prot.doProtocal(bytes);

                    if(commandId !== -1){
                        if(commandId != protId){
                            processWaitingCMDS(commandId,waitData);
                        }
                        else{
                            prot.responseHandler(waitData);
                        }
                    }
                }
            }
            catch(e){
                GameLog.log(e.message);
            }
        }
    }
})();

function Prot6(){
    var protId = 1001;
    this.getProtData = function(data){
        var bytes = new ByteArray();
        return bytes;
    };

    /**
    * 解析6协议
    */
    this.doProtocal = function(data){
        //协议6
        var bytes = new ByteArray(data);

        var prot6 = new Object();
        prot6.stateCode = bytes.readByte();
        if(prot6.stateCode === 1){
            prot6.serverImageURL = bytes.readUTF();//图片服务器地址
            prot6.lowerPrice = bytes.readInt();//交易下限价格
            prot6.upperPrice = bytes.readInt();//交易上限价格
            prot6.isCampaignOpen = bytes.readInt();//战役开关
            prot6.isVIPOpen = bytes.readInt();//VIP开关
            prot6.isRewardOpen = bytes.readInt();//兑换码开关
            prot6.isRestrictBuyOpen = bytes.readInt();//限购开关
            prot6.isActivityOpen = bytes.readInt();//活动开关
            prot6.isHide3DiamondUse = bytes.readInt();//隐藏三处钻石使用
            prot6.isOfficerGroupOpen = bytes.readInt();//军官编制打开
            prot6.errorLogURLForAndroid = bytes.readUTF();//安卓客户端记录错误的地址
            prot6.serverVersion = bytes.readUTF();//服务器版本号
            prot6.mapType = bytes.readInt();//0普通 1海岛
            prot6.errorLogURLForIOS = bytes.readUTF();//iOS客户端记录错误的地址
            prot6.serverKEY = bytes.readUTF();//服务器key
            prot6.isShowGMButton = bytes.readInt();
            prot6.isShowFeedback = bytes.readInt();
            prot6.isShowAllianceWar = bytes.readByte();
        }

        GameDataModel.getInstance().setProtData(protId,prot6);
        var protTemp = GameDataModel.getInstance().getProtData(protId);
        GameLog.log("图片服务器地址："+protTemp.serverImageURL);
    };

    this.responseHandler = function(bytes){
        GameLog.log("=========================>responseHandler 6")
    };
}