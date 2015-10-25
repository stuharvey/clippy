// Setup basic express server
const PORT = process.env.PORT || 3000;

// blog.modulus.io/build-your-first-http-server-in-nodejs
function handleRequest(req, res) {
    var copied = '';
    req.on('data', function(chunk) {
        console.log("Received body data:");
        console.log(chunk.toString());
        copied += chunk;
    });
    req.on('end', function() {
        console.log("Copied: " + copied);
        res.writeHead(200, "OK", {'Content-Type': 'text/html'});
        res.end(copied);
    });
}

// Create the server
var server = require('http').createServer(handleRequest);

// Start the server
server.listen(PORT, function() {
    console.log("Listening on port: " + PORT);
});