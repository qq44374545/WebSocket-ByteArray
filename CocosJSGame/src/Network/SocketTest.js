/**
 * Created by sbxfc on 15/9/23.
 */

function initSocketWork(){

    /**
     * 测试Socket连接
     */
    GameSocket.getInstance().initNetwork();

    var listener = cc.EventListener.create({
        event: cc.EventListener.CUSTOM,
        eventName: CUSTOM_EVENT_GAME_SOCKET_ON_OPEN,
        callback: function(event){
            setInterval(function () {
                /*var prot6 = new Prot6();
                 var bytes = prot6.getProtData();
                 GameSocket.getInstance().sendProt(6,bytes.buffer(),6,"hi 1001 1002!");*/

                var random = Math.random()*10;
                if(random < 4){
                    var prot6 = new Prot6();
                    var bytes = prot6.getProtData();
                    GameSocket.getInstance().sendProt(6,bytes.buffer(),6,"hi6!");
                }
                else if (random < 8){
                    var prot1 = new Prot1();
                    var bytes = prot1.getProtData();
                    GameSocket.getInstance().sendProt(1,bytes.buffer(),1,"hi1!");
                }
                else{
                    var prot6 = new Prot6();
                    var bytes = prot6.getProtData();

                    var prot1 = new Prot1();
                    var bytes2 = prot1.getProtData();

                    var prots = new Array();
                    prots.push([6,bytes]);
                    prots.push([1,bytes2]);
                    GameSocket.getInstance().send(prots,10001,"hi 1001 1002!");
                }
            },3000);
        }
    });
    cc.eventManager.addListener(listener, 1);
}




