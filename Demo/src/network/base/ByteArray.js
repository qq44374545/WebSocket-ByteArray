/*
 *  DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *  Version 2, December 2004
 *
 *  Copyright (C) 2013-2015 sbxfc http://rungame.me
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
 *  @param bytes 接收一个arraybuffer类型的字节数据
 */
var ByteArray = function (bytes) {

    bytes = bytes === undefined ? new ArrayBuffer(0) : bytes;

    var _bytes = bytes;
    var TRANSFER_LENGTH_MIN = 16;//容器每次扩充最小字节长度
    var BIG_ENDIAN = false;
    var LITTLE_ENDIAN = true;
    var HIGHT_WORD_MULTIPLIER = 0x100000000;

    var _dv = new DataView(_bytes);
    var _position = 0;//当前执行读写数据的位置
    var _bytesLength = _bytes.byteLength;
    var self = this;

    /**
     *  @param length 增加容器长度,单位 byte
     *  扩充容器
     */
    self.transfer = function (length) {

        length = length < TRANSFER_LENGTH_MIN ? TRANSFER_LENGTH_MIN : length;

        //扩充容器
        var bytesNew = new ArrayBuffer(_bytes.byteLength + length);
        var dvNew = new Uint8Array(bytesNew);

        //创建容器副本
        var dvCopy = new Uint8Array(_bytes);
        dvNew.set(dvCopy, 0);
        _bytes = dvNew.buffer;

        //构建新的DataView
        _dv = new DataView(_bytes);
    }

    //----------------------------------
    //  write
    //----------------------------------


    /**
     *  @param value 写入一个有符号的字节数据
     *  取值范围[-128,127]
     */
    self.writeByte = function (value) {
        _position++;
        _bytesLength++;
        if (_position >= _bytes.byteLength) {
            self.transfer(1);
        }
        _dv.setInt8(_position - 1, value);
    }

    /**
     * @param value 一个 arraybuffe或Array类型的字节数组
     */
    self.writeBytes = function (data) {

        if (data === undefined) {
            throw Error('parameter value is undefined.');
        }

        var length = 0;
        if (data instanceof Array) {
            length = data.length;
        }
        else if (data instanceof ArrayBuffer) {
            length = data.byteLength;
        }

        if (length > 0) {
            if ((_position + length) >= _bytes.byteLength) {
                self.transfer(length);
            }

            var dataDV = new Uint8Array(data);
            var bytesDV = new Uint8Array(_bytes);
            bytesDV.set(dataDV, _position);
            _position += dataDV.byteLength;
            _bytesLength += dataDV.byteLength;
        }
    }


    /**
     *  @param value 写入一个有符号的32位整形数据
     *  网络字节流使用大端序 BIG_ENDIAN
     */
    self.writeInt = function (value) {
        _position += 4;
        _bytesLength += 4;
        if (_position >= _bytes.byteLength) {
            self.transfer(4);
        }
        _dv.setInt32(_position - 4, value, BIG_ENDIAN);
    }

    /**
     *  @param value 写入一个有符号的64位整形数据
     */
    self.writeLong = function (value) {
        _position += 8;
        _bytesLength += 8;
        if (_position >= _bytes.byteLength) {
            self.transfer(8);
        }

        var hi = Math.floor(value / HIGHT_WORD_MULTIPLIER);
        _dv.setInt32(_position - 8, hi, BIG_ENDIAN);
        _dv.setInt32(_position - 4, value, BIG_ENDIAN);

    }

    /**
     *  @param value 写入一个有符号的64位浮点数
     */
    self.writeDouble = function (value) {
        _position += 8;
        _bytesLength += 8;
        if (_position >= _bytes.byteLength) {
            self.transfer(8);
        }

        _dv.setFloat64(_position - 8, value, BIG_ENDIAN);
    }

    /**
     *  @param value 写入一个UTF-8格式的字符串
     */
    self.writeUTF = function (value) {
        value = value === undefined || typeof  value !== 'string' ? '' : value;
        var bytesValue = UTF8.setBytesFromString(value);
        self.writeInt(bytesValue.length);
        self.writeBytes(bytesValue);
    }

    //----------------------------------
    //  read
    //----------------------------------

    /**
     *  读取一个有符号的字节
     *  网络字节流使用大端序 BIG_ENDIAN
     */
    self.readByte = function () {
        _position++;
        return _dv.getInt8(_position - 1, BIG_ENDIAN);
    }

    /**
     *  读取一个32位整数
     *  网络字节流使用大端序 BIG_ENDIAN
     */
    self.readInt = function () {
        _position += 4;
        return _dv.getInt32(_position - 4, BIG_ENDIAN);
    }

    /**
     *  读取一个64位浮点数
     *  网络字节流使用大端序 BIG_ENDIAN
     */
    self.readDouble = function () {
        _position += 8;
        return _dv.getFloat64(_position - 8, BIG_ENDIAN);
    }

    /**
     *  读取一个64位整数
     *  网络字节流使用大端序 BIG_ENDIAN
     */
    self.readLong = function () {
        _position += 8;

        var lo, hi;
        hi = _dv.getInt32(_position - 8, BIG_ENDIAN);
        lo = _dv.getUint32(_position - 4, BIG_ENDIAN);
        return lo + hi * HIGHT_WORD_MULTIPLIER;
    }

    /**
     *  @param byteLength 读取指定长度为byteLength的字节
     */
    self.readBytes = function (byteLength) {
        byteLength = ('number' === typeof byteLength ?
                byteLength : 0
        );

        //读取字符串的所有字节
        _position += byteLength;
        return new Uint8Array(_bytes, _position - byteLength, byteLength);
    }

    /**
     *  读取一个UTF-8格式的字符串
     */
    self.readUTF = function () {
        //读取字符串长度
        var length = self.readInt();

        var stringBytes = self.readBytes(length)
        var str = UTF8.getStringFromBytes(stringBytes);
        return str;
    }

    //获取ByteArray里的字节
    self.buffer = function () {
        return self.slice(0, _bytesLength);
    }

    //返回字节长度
    self.slice = function (start, end) {
        end = end === undefined ? _bytesLength : end;
        return _bytes.slice(start, end);
    }

    //返回字节长度
    self.bytesLength = function () {
        return _bytesLength;
    }
};

//检测设备大小端
var littleEndian = (function () {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
})();

if (!String.fromCodePoint) {
    (function () {
        var defineProperty = (function () {
            // IE 8 only supports `Object.defineProperty` on DOM elements
            try {
                var object = {};
                var $defineProperty = Object.defineProperty;
                var result = $defineProperty(object, object, object) && $defineProperty;
            } catch (error) {
            }
            return result;
        }());
        var stringFromCharCode = String.fromCharCode;
        var floor = Math.floor;
        var fromCodePoint = function () {
            var MAX_SIZE = 0x4000;
            var codeUnits = [];
            var highSurrogate;
            var lowSurrogate;
            var index = -1;
            var length = arguments.length;
            if (!length) {
                return '';
            }
            var result = '';
            while (++index < length) {
                var codePoint = Number(arguments[index]);
                if (
                    !isFinite(codePoint) ||       // `NaN`, `+Infinity`, or `-Infinity`
                    codePoint < 0 ||              // not a valid Unicode code point
                    codePoint > 0x10FFFF ||       // not a valid Unicode code point
                    floor(codePoint) != codePoint // not an integer
                ) {
                    throw RangeError('Invalid code point: ' + codePoint);
                }
                if (codePoint <= 0xFFFF) { // BMP code point
                    codeUnits.push(codePoint);
                } else { // Astral code point; split in surrogate halves
                    // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                    codePoint -= 0x10000;
                    highSurrogate = (codePoint >> 10) + 0xD800;
                    lowSurrogate = (codePoint % 0x400) + 0xDC00;
                    codeUnits.push(highSurrogate, lowSurrogate);
                }
                if (index + 1 == length || codeUnits.length > MAX_SIZE) {
                    result += stringFromCharCode.apply(null, codeUnits);
                    codeUnits.length = 0;
                }
            }
            return result;
        };
        if (defineProperty) {
            defineProperty(String, 'fromCodePoint', {
                'value': fromCodePoint,
                'configurable': true,
                'writable': true
            });
        } else {
            String.fromCodePoint = fromCodePoint;
        }
    }());
}

if (!String.prototype.codePointAt) {
    (function () {
        'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
        var codePointAt = function (position) {
            if (this == null) {
                throw TypeError();
            }
            var string = String(this);
            var size = string.length;
            // `ToInteger`
            var index = position ? Number(position) : 0;
            if (index != index) { // better `isNaN`
                index = 0;
            }
            // Account for out-of-bounds indices:
            if (index < 0 || index >= size) {
                return undefined;
            }
            // Get the first code unit
            var first = string.charCodeAt(index);
            var second;
            if ( // check if it’s the start of a surrogate pair
            first >= 0xD800 && first <= 0xDBFF && // high surrogate
            size > index + 1 // there is a next code unit
            ) {
                second = string.charCodeAt(index + 1);
                if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
                    // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                    return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
                }
            }
            return first;
        };
        if (Object.defineProperty) {
            Object.defineProperty(String.prototype, 'codePointAt', {
                'value': codePointAt,
                'configurable': true,
                'writable': true
            });
        } else {
            String.prototype.codePointAt = codePointAt;
        }
    }());
}


var UTF8 = {

    // non UTF8 encoding detection (cf README file for details)
    'isNotUTF8': function (bytes, byteOffset, byteLength) {
        try {
            UTF8.getStringFromBytes(bytes, byteOffset, byteLength, true);
        } catch (e) {
            return true;
        }
        return false;
    },
    // UTF8 decoding functions
    'getCharLength': function (theByte) {
        // 4 bytes encoded char (mask 11110000)
        if (0xF0 == (theByte & 0xF0)) {
            return 4;
            // 3 bytes encoded char (mask 11100000)
        } else if (0xE0 == (theByte & 0xE0)) {
            return 3;
            // 2 bytes encoded char (mask 11000000)
        } else if (0xC0 == (theByte & 0xC0)) {
            return 2;
            // 1 bytes encoded char
        } else if (theByte == (theByte & 0x7F)) {
            return 1;
        }
        return 0;
    },
    'getCharCode': function (bytes, byteOffset, charLength) {
        var charCode = 0, mask = '';
        byteOffset = byteOffset || 0;
        // Retrieve charLength if not given
        charLength = charLength || UTF8.getCharLength(bytes[byteOffset]);
        if (charLength == 0) {
            throw new Error(bytes[byteOffset].toString(2) + ' is not a significative' +
                ' byte (offset:' + byteOffset + ').');
        }
        // Return byte value if charlength is 1
        if (1 === charLength) {
            return bytes[byteOffset];
        }
        // Test UTF8 integrity
        mask = '00000000'.slice(0, charLength) + 1 + '00000000'.slice(charLength + 1);
        if (bytes[byteOffset] & (parseInt(mask, 2))) {
            throw Error('Index ' + byteOffset + ': A ' + charLength + ' bytes' +
                ' encoded char' + ' cannot encode the ' + (charLength + 1) + 'th rank bit to 1.');
        }
        // Reading the first byte
        mask = '0000'.slice(0, charLength + 1) + '11111111'.slice(charLength + 1);
        charCode += (bytes[byteOffset] & parseInt(mask, 2)) << ((--charLength) * 6);
        // Reading the next bytes
        while (charLength) {
            if (0x80 !== (bytes[byteOffset + 1] & 0x80)
                || 0x40 === (bytes[byteOffset + 1] & 0x40)) {
                throw Error('Index ' + (byteOffset + 1) + ': Next bytes of encoded char'
                    + ' must begin with a "10" bit sequence.');
            }
            charCode += ((bytes[++byteOffset] & 0x3F) << ((--charLength) * 6));
        }
        return charCode;
    },
    'getStringFromBytes': function (bytes, byteOffset, byteLength, strict) {
        var charLength, chars = [];
        byteOffset = byteOffset | 0;
        byteLength = ('number' === typeof byteLength ?
                byteLength :
            bytes.byteLength || bytes.length
        );
        for (; byteOffset < byteLength; byteOffset++) {
            charLength = UTF8.getCharLength(bytes[byteOffset]);
            if (byteOffset + charLength > byteLength) {
                if (strict) {
                    throw Error('Index ' + byteOffset + ': Found a ' + charLength +
                        ' bytes encoded char declaration but only ' +
                        (byteLength - byteOffset) + ' bytes are available.');
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
    'getBytesForCharCode': function (charCode) {
        if (charCode < 128) {
            return 1;
        } else if (charCode < 2048) {
            return 2;
        } else if (charCode < 65536) {
            return 3;
        } else if (charCode < 2097152) {
            return 4;
        }
        throw new Error('CharCode ' + charCode + ' cannot be encoded with UTF8.');
    },
    'setBytesFromCharCode': function (charCode, bytes, byteOffset, neededBytes) {
        charCode = charCode | 0;
        bytes = bytes || [];
        byteOffset = byteOffset | 0;
        neededBytes = neededBytes || UTF8.getBytesForCharCode(charCode);
        // Setting the charCode as it to bytes if the byte length is 1
        if (1 == neededBytes) {
            bytes[byteOffset] = charCode;
        } else {
            // Computing the first byte
            bytes[byteOffset++] =
                (parseInt('1111'.slice(0, neededBytes), 2) << 8 - neededBytes) +
                (charCode >>> ((--neededBytes) * 6));
            // Computing next bytes
            for (; neededBytes > 0;) {
                bytes[byteOffset++] = ((charCode >>> ((--neededBytes) * 6)) & 0x3F) | 0x80;
            }
        }
        return bytes;
    },
    'setBytesFromString': function (string, bytes, byteOffset, byteLength, strict) {
        string = string || '';
        bytes = bytes || [];
        byteOffset = byteOffset | 0;
        byteLength = ('number' === typeof byteLength ?
                byteLength :
            bytes.byteLength || Infinity
        );
        for (var i = 0, j = string.length; i < j; i++) {
            var neededBytes = UTF8.getBytesForCharCode(string[i].codePointAt(0));
            if (strict && byteOffset + neededBytes > byteLength) {
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
