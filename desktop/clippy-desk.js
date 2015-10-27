// declare clipboard accessors
var copyPaste = require('copy-paste');
var https = require('https');
// copy(text, [callback])
var copy = copyPaste.copy; // copies @param text into the clipboard
// paste([callback])
var paste = copyPaste.paste; // pastes the most recently copied item

// start the clipboard service when the page renders
$(document).ready(function() {
    var clippy_desk = new ClippyDesk();
});

var ClippyDesk = function() {
    // get the last copied text
    var that = this;
    $("#username")
        .keypress(function(e) {
            // if enter is pressed, test copy + paste
            if (e.which === 13) {
                that.getFromServer($(this).val()); // get user clipboard
            }
        }
    );

    this.options = {
        host: 'localhost',
        path: '/',
        port: '3000',
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        }
    };

    this.retrieveCallback = function (res) {
        var str = '';
        res.on('data', function(chunk) {
            str += chunk;
        });
        res.on('end', function() {
            console.log("Server sent: " + str);
            $("#response").text("User's clipboard is: ");
            $("#clipboard").text(JSON.parse(str));
        });
    };

    this.sendCallback = function (res) {
        var str = '';
        res.on('data', function(chunk) {
            str += chunk;
        });
        res.on('end', function() {
            console.log("Server sent: " + str);
            $("#response").text("Server responded with: " + str);
        });
    }

    this.lastCopied = paste();

    // checks to see if anything new has been copied
    setInterval(that.checkClipboard, 1500, that);
}

ClippyDesk.prototype.checkClipboard = function(that) {
    var current = paste();
    var previous = that.lastCopied;
    if (previous !== current) {
        that.updateClippyboard(current);
    }
}

ClippyDesk.prototype.getFromServer = function(username) {
    var req = https.request(this.options, this.retrieveCallback);
    // edit this to get a generic username
    req.write(JSON.stringify({
        type: "get_clipboard",
        data: {
            user: "admin",
            pass: "---"
        }
    }));
    req.end();
}

// called when we detect something new has been copied
ClippyDesk.prototype.updateClippyboard = function(newlyCopied) {
    // will send to server here
    this.lastCopied = newlyCopied;
    this.sendToServer(newlyCopied);
}

ClippyDesk.prototype.sendToServer = function(newlyCopied) {
    var req = https.request(this.options, this.sendCallback);
    req.write(JSON.stringify({
        type:"clipboard_update",
        data: {
            user: "admin",
            copied: newlyCopied
        }
    }));
    req.end();
}
