
var HelloWorldLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        //////////////////////////////
        // 1. super init first
        this._super();


//////////////////////////////////WebSocket////////////////////////////////////


        /**
         * STEP 1 连接服务器
         */
        GameSocket.getInstance().initNetwork();

        /**
         * STEP 2 服务器连接成功,登陆游戏
         */
        var listener = cc.EventListener.create({
            event: cc.EventListener.CUSTOM,
            eventName: CUSTOM_EVENT_GAME_SOCKET_ON_OPEN,
            callback: function (event) {
                console.log("连接服务器成功!");
                var loginEvt = new GameLoginEvent();
                loginEvt.login(241, "1505271000000358872");
            }
        });
        cc.eventManager.addListener(listener, 1);

////////////////////////////////////////////////////////////////////////////////


        return true;
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});

