// Setup basic express server
const PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();

app.get('/', function(req, res) {
    console.log('GET /');

    res.end("got your get lol");
});

// when the server receives a POST, run handlePost
app.post('/', handlePost);

// prints the copy data send by the client
function handlePost(req, res) {
    var copied = '';
    req.on('data', function(chunk) {
        console.log("Received body data:");
        console.log(chunk.toString());
        copied += chunk;
    });
    req.on('end', function() {
        console.log("Copied: " + copied);
        // write to database
        writeToDB(copied);
        res.writeHead(200, "OK", {'Content-Type': 'text/html'});
        res.end(copied);
    });
}

function writeToDB (lastCopied) {
    // insert under user's id
}

app.listen(PORT);
console.log("Listening on port: " + PORT);
