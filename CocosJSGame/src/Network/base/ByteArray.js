/*
 *  DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *  Version 2, December 2004
 *
 *  Copyright (C) 2013-2015 sbxfc rungame.me
 *
 *  Everyone is permitted to copy and distribute verbatim or modified
 *  copies of this license document, and changing it is allowed as long
 *  as the name is changed.
 *
 *  DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *  TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
 *
 *  0. You just DO WHAT THE FUCK YOU WANT TO.
 */


/**
 *  @param bytes 接受一个arraybuffer类型的字节数据
 */
var ByteArray = function (bytes) {

    bytes = bytes === undefined ? new ArrayBuffer(0) : bytes;

    var dv = new DataView(bytes);
    var TRANSFER_LENGTH_MIN =  16;//每次扩展bytes容器的最小长度
    var self = this;
    var kHighWordMultiplier = 0x100000000;
    var BIG_ENDIAN = false;
    var LITTLE_ENDIAN = true;
    //如果是网络通信,则使用网络字节序(大端字节序BIG_ENDIAN),如果是本地测试,这里直接调用littleEndian来判断就可以
    var WRITE_ENDIAN = false;//littleEndian;
    var endian = littleEndian;
    var position = 0;//当前执行读写数据的位置
    var _bytesLength = bytes.byteLength;

    //该函数用于扩充bytes容器的大小
    self.transfer = function(length){

        length = length < TRANSFER_LENGTH_MIN ? TRANSFER_LENGTH_MIN : length;

        //扩充后的bytes容器
        var bytesTemp = new ArrayBuffer(bytes.byteLength + length);
        //为扩充后的容器构建View
        var viewTemp = new Uint8Array(bytesTemp);

        //创建原有bytes的View
        var viewRef = new Uint8Array(bytes);
        viewTemp.set(viewRef,0);
        //生成新的bytes容器
        bytes  =  viewTemp.buffer;

        //构建新的View
        dv = new DataView(bytes);
    }

    //----------------------------------
    //  write
    //----------------------------------


    /**
     *  @param value 写入一个有符号的字节数据
     *  取值范围[-128,127]
     */
    self.writeByte = function (value) {
        position ++;
        _bytesLength ++;
        if(position >= bytes.byteLength){
            self.transfer(1);
        }
        dv.setInt8(position-1,value);
    }

    /**
     * @param value 一个 arraybuffer类型的字节数组
     */
    self.writeBytes = function(value){
        if (value === undefined){
            throw Error('parameter value is undefined.');
        }

        if((position + value.byteLength) >= bytes.byteLength){
            self.transfer(value.byteLength);
        }
        var u8Temp = new Uint8Array(value);
        var u8bytes = new Uint8Array(bytes);
        u8bytes.set(u8Temp,position);
        position += u8Temp.byteLength;
        _bytesLength += u8Temp.byteLength;
    }


    /**
     *  @param value 写入一个有符号的32位整形数据
     */
    self.writeInt = function (value) {
        position += 4;
        _bytesLength += 4;
        if(position >= bytes.byteLength){
            self.transfer(4);
        }
        dv.setInt32(position-4,value,WRITE_ENDIAN);
    }

    /**
     *  @param value 写入一个有符号的64位整形数据
     */
    self.writeLong = function (value) {
        position += 8;
        _bytesLength += 8;
        if(position >= bytes.byteLength){
            self.transfer(8);
        }

        var hi = Math.floor(value / kHighWordMultiplier);
        if (WRITE_ENDIAN == LITTLE_ENDIAN) {
            dv.setInt32(position -8, value, LITTLE_ENDIAN);
            dv.setInt32(position -4, hi, LITTLE_ENDIAN);
        } else {
            dv.setInt32(position -8, hi, BIG_ENDIAN);
            dv.setInt32(position -4, value, BIG_ENDIAN);
        }

    }

    /**
     *  @param value 写入一个有符号的64位浮点数
     */
    self.writeDouble = function (value) {
        position += 8;
        _bytesLength += 8;
        if(position >= bytes.byteLength){
            self.transfer(8);
        }

        dv.setFloat64(position-8,value,WRITE_ENDIAN);
    }

    /**
     *  @param value 写入一个UTF-8格式的字符串
     */
    self.writeUTF = function(value)
    {
        value = value === undefined || typeof  value !== 'string' ? '' : value;

        var tempBytes = UTF8.setBytesFromString(value);
        if (UTF8.isNotUTF8(tempBytes)){
            throw Error('The value :['+ value +'] is Not a UTF-8 string.');
        }
        self.writeInt(tempBytes.length);
        self.writeBytes(tempBytes);
    }

    //----------------------------------
    //  read
    //----------------------------------

    /**
     *  读取一个有符号的字节
     */
    self.readByte = function () {
        position ++;
        return dv.getInt8(position-1,BIG_ENDIAN);
    }

    /**
     *  读取一个32位整数
     */
    self.readInt = function () {
        position += 4;
        return dv.getInt32(position-4,BIG_ENDIAN);
    }

    /**
     *  读取一个64位浮点数
     */
    self.readDouble = function () {
        position += 8;
        return dv.getFloat64(position-8,BIG_ENDIAN);
    }

    /**
     *  读取一个64位整数
     */
    self.readLong = function () {
        position += 8;

        var lo, hi;
        if (BIG_ENDIAN == LITTLE_ENDIAN) {
            lo = dv.getUint32(position - 8, LITTLE_ENDIAN);
            hi = dv.getInt32(position -4, LITTLE_ENDIAN);
        } else {
            hi = dv.getInt32(position - 8, BIG_ENDIAN);
            lo = dv.getUint32(position - 4, BIG_ENDIAN);
        }
        return lo + hi * kHighWordMultiplier;
    }

    /**
     *  @param byteLength 读取指定长度为byteLength的字节
     */
    self.readBytes = function(byteLength){
        byteLength = ('number' === typeof byteLength ?
                byteLength : 0
        );

        //读取字符串的所有字节
        position += byteLength;
        return new Uint8Array(bytes,position - byteLength,byteLength);
    }

    /**
     *  读取一个UTF-8格式的字符串
     */
    self.readUTF = function(){
        //读取字符串长度
        var length = self.readInt();

        var stringBytes = self.readBytes(length)
        var str = UTF8.getStringFromBytes(stringBytes);
        return str;
    }

    //获取ByteArray里的字节
    self.buffer = function () {
        return self.slice(0,_bytesLength);
    }

    //返回字节长度
    self.slice = function(start,end){
        end = end === undefined ? _bytesLength:end;
        return bytes.slice(start,end);
    }

    //返回字节长度
    self.bytesLength = function(){
        return _bytesLength;
    }
};

//检测是否是小端设备
var littleEndian = (function() {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
})();

/*if(module.require) {
 require('string.fromcodepoint');
 require('string.prototype.codepointat');
 }*/

var UTF8={

    // non UTF8 encoding detection (cf README file for details)
    'isNotUTF8': function(bytes, byteOffset, byteLength) {
        try {
            UTF8.getStringFromBytes(bytes, byteOffset, byteLength, true);
        } catch(e) {
            return true;
        }
        return false;
    },
    // UTF8 decoding functions
    'getCharLength': function(theByte) {
        // 4 bytes encoded char (mask 11110000)
        if(0xF0 == (theByte&0xF0)) {
            return 4;
            // 3 bytes encoded char (mask 11100000)
        } else if(0xE0 == (theByte&0xE0)) {
            return 3;
            // 2 bytes encoded char (mask 11000000)
        } else if(0xC0 == (theByte&0xC0)) {
            return 2;
            // 1 bytes encoded char
        } else if(theByte == (theByte&0x7F)) {
            return 1;
        }
        return 0;
    },
    'getCharCode': function(bytes, byteOffset, charLength) {
        var charCode = 0, mask = '';
        byteOffset = byteOffset || 0;
        // Retrieve charLength if not given
        charLength = charLength || UTF8.getCharLength(bytes[byteOffset]);
        if(charLength == 0) {
            throw new Error(bytes[byteOffset].toString(2)+' is not a significative' +
                ' byte (offset:'+byteOffset+').');
        }
        // Return byte value if charlength is 1
        if(1 === charLength) {
            return bytes[byteOffset];
        }
        // Test UTF8 integrity
        mask = '00000000'.slice(0, charLength) + 1 + '00000000'.slice(charLength + 1);
        if(bytes[byteOffset]&(parseInt(mask, 2))) {
            throw Error('Index ' + byteOffset + ': A ' + charLength + ' bytes' +
                ' encoded char' +' cannot encode the '+(charLength+1)+'th rank bit to 1.');
        }
        // Reading the first byte
        mask='0000'.slice(0,charLength+1)+'11111111'.slice(charLength+1);
        charCode+=(bytes[byteOffset]&parseInt(mask,2))<<((--charLength)*6);
        // Reading the next bytes
        while(charLength) {
            if(0x80!==(bytes[byteOffset+1]&0x80)
                ||0x40===(bytes[byteOffset+1]&0x40)) {
                throw Error('Index '+(byteOffset+1)+': Next bytes of encoded char'
                    +' must begin with a "10" bit sequence.');
            }
            charCode += ((bytes[++byteOffset]&0x3F) << ((--charLength) * 6));
        }
        return charCode;
    },
    'getStringFromBytes': function(bytes, byteOffset, byteLength, strict) {
        var charLength, chars = [];
        byteOffset = byteOffset|0;
        byteLength=('number' === typeof byteLength ?
                byteLength :
            bytes.byteLength || bytes.length
        );
        for(; byteOffset < byteLength; byteOffset++) {
            charLength = UTF8.getCharLength(bytes[byteOffset]);
            if(byteOffset + charLength > byteLength) {
                if(strict) {
                    throw Error('Index ' + byteOffset + ': Found a ' + charLength +
                        ' bytes encoded char declaration but only ' +
                        (byteLength - byteOffset) +' bytes are available.');
                }
            } else {
                chars.push(String.fromCodePoint(
                    UTF8.getCharCode(bytes, byteOffset, charLength, strict)
                ));
            }
            byteOffset += charLength - 1;
        }
        return chars.join('');
    },
    // UTF8 encoding functions
    'getBytesForCharCode': function(charCode) {
        if(charCode < 128) {
            return 1;
        } else if(charCode < 2048) {
            return 2;
        } else if(charCode < 65536) {
            return 3;
        } else if(charCode < 2097152) {
            return 4;
        }
        throw new Error('CharCode '+charCode+' cannot be encoded with UTF8.');
    },
    'setBytesFromCharCode': function(charCode, bytes, byteOffset, neededBytes) {
        charCode = charCode|0;
        bytes = bytes || [];
        byteOffset = byteOffset|0;
        neededBytes = neededBytes || UTF8.getBytesForCharCode(charCode);
        // Setting the charCode as it to bytes if the byte length is 1
        if(1 == neededBytes) {
            bytes[byteOffset] = charCode;
        } else {
            // Computing the first byte
            bytes[byteOffset++] =
                (parseInt('1111'.slice(0, neededBytes), 2) << 8 - neededBytes) +
                (charCode >>> ((--neededBytes) * 6));
            // Computing next bytes
            for(;neededBytes>0;) {
                bytes[byteOffset++] = ((charCode>>>((--neededBytes) * 6))&0x3F)|0x80;
            }
        }
        return bytes;
    },
    'setBytesFromString': function(string, bytes, byteOffset, byteLength, strict) {
        string = string || '';
        bytes = bytes || [];
        byteOffset = byteOffset|0;
        byteLength = ('number' === typeof byteLength ?
                byteLength :
            bytes.byteLength||Infinity
        );
        for(var i = 0, j = string.length; i < j; i++) {
            var neededBytes = UTF8.getBytesForCharCode(string[i].codePointAt(0));
            if(strict && byteOffset + neededBytes > byteLength) {
                throw new Error('Not enought bytes to encode the char "' + string[i] +
                    '" at the offset "' + byteOffset + '".');
            }
            UTF8.setBytesFromCharCode(string[i].codePointAt(0),
                bytes, byteOffset, neededBytes, strict);
            byteOffset += neededBytes;
        }
        return bytes;
    }
};

if('undefined' !== typeof module) {
    module.exports = UTF8;
}