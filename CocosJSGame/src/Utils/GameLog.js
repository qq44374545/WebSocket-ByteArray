/**
 * Created by Administrator on 2015/10/12.
 */
var GameLog = (function(){
    return{
        log:function(message){
            console.log(message);
        },
        error:function(message){
            new Error(message);
        }
    };
})();