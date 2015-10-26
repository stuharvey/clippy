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
    this.lastCopied = paste();
    $("#currentPBText").text("Your most recent clipboard item:\n" +
                             this.lastCopied);
    
    $("#copyfield")
        .keyup(function() {
            // display the input as it is edited
            var inputText = $(this).val();
            $("#in").text("You typed: " + inputText);
        }
    );

    var that = this;
    $("#copyfield")
        .keypress(function(e) {
            // if enter is pressed, test copy+paste
            if (e.which == 13) {
                that.testCopyPaste($(this).val());
            }
        }
    );

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

ClippyDesk.prototype.updateClippyboard = function(newlyCopied) {
    this.lastCopied = newlyCopied;
    $("#paste").text("Copied \"" + newlyCopied + "\"");
    
    // will send to server here
    this.sendToServer(newlyCopied);
}

ClippyDesk.prototype.sendToServer = function(newlyCopied) {
    // using http module
    var options = {
        host: 'localhost',
        path: '/',
        port: '3000',
        method: 'POST',
        type: 'application/json'
    };

    function callback (res) {
        var str = '';
        res.on('data', function(chunk) {
            str += chunk;
        });
        res.on('end', function() {
            console.log("Server sent: " + str);
            $("#response").text("Server response: " + str);
        });
    };

    var req = https.request(options, callback);
    req.write(JSON.stringify({user: 'admin', copied: newlyCopied}));
    // req.write(newlyCopied);
    req.end();
}

ClippyDesk.prototype.testCopyPaste = function(text) {
    copyPaste.copy(text); // should copy to the system clipboard if everything works
    $("#paste").text("Copied \"" + paste() + "\"");
}