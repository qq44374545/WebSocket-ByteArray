
var socket = new IOSocket();
socket.initNetwork("ws://echo.websocket.org/");

window.addEventListener(SOCKET_EVENT_CONNECTED, function() {
    console.log('连接成功!');
    var bytes = new ByteArray();
    bytes.writeUTF("闻说双溪春尚好");
    bytes.writeByte(127);
    bytes.writeInt(666);
    bytes.writeLong(201412270547);
    bytes.writeDouble(20141227.0547);
    socket.send(bytes.buffer());
}, false);

window.addEventListener(SOCKET_EVENT_ONDATA, function(evt) {
    var bytes = new ByteArray(evt.data);
    console.log(bytes.readUTF());
    console.log(bytes.readByte());
    console.log(bytes.readInt());
    console.log(bytes.readLong());
    console.log(bytes.readDouble());
},false);


