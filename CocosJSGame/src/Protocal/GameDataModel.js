/**
 * Created by sbxfc on 2015/10/14.
 */

var GameDataModel  = (function(){
    var _instance = null;
    function getGameDataModel (){
        var protData = null;
        return {
            /**
             * 向缓存里设置协议数据
             * @param protId　协议号　
             * @param data 协议数据
             * @param type 类型
             */
            setProtData:function(protId,data,type){
                if(protData === null){
                    protData = new Object();
                }

                if(typeof protId !== "number") {
                    return null;
                }

                var keyName = protId.toString();
                if(type !== undefined){
                    if(typeof type !== "number") {
                        return null;
                    }
                    keyName = keyName + "WIST_PROT"+ type.toString();
                }
                protData[keyName] = data;
            },
            /**
             * 根据协议号返回相应的协议数据
             * @param protId　协议号　
             * @param type 类型
             */
            getProtData: function (protId,type) {
                if(typeof protId !== "number") {
                    return null;
                }

                var keyName = protId.toString();
                if(type !== undefined){
                    if(typeof type !== "number") {
                        return null;
                    }
                    keyName = keyName + "WIST_PROT"+ type.toString();
                }
                return protData[keyName];
            }
        };
    };


    return {
        getInstance:function(){
            if(_instance === null){
                _instance = getGameDataModel();
            }
            return _instance;
        }
    };
})();