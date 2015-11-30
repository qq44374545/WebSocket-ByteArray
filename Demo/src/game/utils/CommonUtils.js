/**
 * Created by sbxfc on 2015/10/13.
 */

var GameLog = (function () {
    return {
        log: function (message) {
            console.log(message);
        },
        error: function (message) {
            new Error(message);
        }
    };
})();