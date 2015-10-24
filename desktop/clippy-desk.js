var copyPaste = require('copy-paste');
// copy(text, [callback])
var copy = copyPaste.copy; // copies @param text into the clipboard
// paste([callback])
var paste = copyPaste.paste; // pastes the most recently copied item

$(document).ready(function() {
    $("#currentPBText").text("Your most recent clipboard item:\n" + paste());
});

$("#copyfield")
    .keyup(function() {
        // display the input as it is edited
        var inputText = $(this).val();
        $("#in").text("You typed: " + inputText);
    });

$("#copyfield")
    .keypress(function(e) {
        // if enter is pressed, test copy+paste
        if (e.which == 13) {
            testCopyPaste($(this).val());
        }
    });

var testCopyPaste = function(text) {
    copyPaste.copy(text); // should copy to the system clipboard if everything works
    $("#paste").text("Copied \"" + paste() + "\"");
}