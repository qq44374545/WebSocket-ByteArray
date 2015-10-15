/**
 * Created by sbxfc on 15/9/23.
 */

function initSocket(){

    ServerSocket.getInstance().initNetwork();

    //确保与服务器连接成功后发送信息
    var listener = cc.EventListener.create({
        event: cc.EventListener.CUSTOM,
        eventName: CUSTOM_EVENT_SELECT_SERVER_SOCKET_ON_OPEN,
        callback: function(event){
            //socket连接成功!
            GameLog.log("选服服务器连接成功!");



            setInterval(function () {
                var prot6 = new Prot6();
                var bytes = prot6.getProtData();
                ServerSocket.getInstance().sendProt(6,bytes.buffer(),6,"hi!");

                /*var prots = new Array();
                prots.push([1001,bytes]);
                prots.push([1002,bytes2]);
                ServerSocket.getInstance().send(prots,10001,"hi 1001 1002!");*/
            }, 3000);

        }
    });
    cc.eventManager.addListener(listener, 1);
}




