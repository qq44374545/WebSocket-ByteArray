var socket = new IOSocket();
socket.initNetwork("ws://echo.websocket.org/");

window.addEventListener(SOCKET_EVENT_CONNECTED, function() {
    console.log('连接成功!');
    var bytes = new ByteArray();
    bytes.writeUTF("《问刘十九》");
    bytes.writeUTF("---白居易");
    bytes.writeUTF("绿蚁新醅酒，");
    bytes.writeUTF("红泥小火炉。");
    bytes.writeUTF("晚来天欲雪，");
    bytes.writeUTF("能饮一杯无？");
    bytes.writeByte(123);
    bytes.writeInt(123456);
    bytes.writeLong(201412270547);
    bytes.writeDouble(20141227.0547);
    socket.send(bytes.buffer());
}, false);

window.addEventListener(SOCKET_EVENT_ONDATA, function(evt) {
    var bytes = new ByteArray(evt.data);
    document.write(bytes.readUTF()+'<br>');
    document.write(bytes.readUTF()+'<br>');
    document.write(bytes.readUTF()+'<br>');
    document.write(bytes.readUTF()+'<br>');
    document.write(bytes.readUTF()+'<br>');
    document.write(bytes.readUTF()+'<br>');
    document.write(bytes.readByte()+'<br>');
    document.write(bytes.readInt()+'<br>');
    document.write(bytes.readLong()+'<br>');
    document.write(bytes.readDouble()+'<br>');
},false);
