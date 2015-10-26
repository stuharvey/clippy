// Setup basic express https server
var https = require('https');
var fs = require('fs');
const PORT = process.env.PORT || 3000;
var express = require('express');
var bodyParser = require('body-parser');
var Parse = require('kaiseki');

/* may want parse functions in separate file
 * for now, they will be in 
function includeInThisContext (path) {
    var code = fs.readFileSync(path);
    vm.runInThisContext(code, path);
}.bind(this);

includeInThisContext("parse.js");
*/

var ClippyServer = function() {
    this.httpsOpts = {
        key: fs.readFileSync('server_keys/key.pem'),
        cert: fs.readFileSync('server_keys/key-cert.pem')
    };

    this.server = express();
    // accept requests in the form of JSON
    this.jsonParser = bodyParser.json();

    this.server.get('/', this.rootGet);
    // when the server receives a POST, run handlePost
    this.server.post('/', this.jsonParser, this.handlePost);

    // connect to DB
    this.dbConnect({
        APP_ID: fs.readFileSync('server_keys/parse_app_id'),
        REST_API_KEY: fs.readFileSync('server_keys/parse_rest_api_key')
    });

    // must start the server last
    this.startServer();
}

ClippyServer.prototype.startServer = function() {
    https.createServer(this.httpsOpts, this.server).listen(PORT);
    console.log("Listening on port: " + PORT);
}

ClippyServer.prototype.rootGet = function(req, res) {
    console.log('GET /');
    res.end("got your get lol");
}

// prints the copy data send by the client
ClippyServer.prototype.handlePost = function(req, res) {
    var copied = '';
    req.on('data', function(chunk) {
        console.log("Received body data:");
        console.log(chunk.toString());
        copied += chunk;
    });
    req.on('end', function() {
        var userData = JSON.parse(copied);
        console.log("User: " + userData.user + "\nCopied: " + userData.copied);
        // write to database
        writeToDB(copied);
        res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
        res.end(copied);
    });
}

ClippyServer.prototype.dbConnect = function(parseKeys) {
    console.log("Parse app id: " + parseKeys.APP_ID +
                "\nParse REST API key: " + parseKeys.REST_API_KEY);
}

function writeToDB (lastCopied) {
    return null;
}

var clippyServer = new ClippyServer();