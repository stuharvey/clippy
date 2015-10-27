// Setup basic express https server
var https = require('https');
var fs = require('fs');
const PORT = process.env.PORT || 3000;
var express = require('express');
var bodyParser = require('body-parser');

var ClippyServer = function() {
    this.httpsOpts = {
        key: fs.readFileSync('server_keys/key.pem'),
        cert: fs.readFileSync('server_keys/key-cert.pem')
    };

    this.server = express();
    // accept requests in the form of JSON
    this.jsonParser = bodyParser.json();
    this.server.use(bodyParser.json());

    this.server.get('/', this.get);
    // when the server receives a POST, run handlePost
    this.server.post('/', this.handlePost);

    this.db;
    // connect to DB
    this.dbConnect({ // connect with keys needed for authentication
        ORCHESTRATE_KEY:fs.readFileSync('server_keys/orchestrate_api_key')
    });
    // double check if we're connected
    if (this.db === undefined) {
        console.log("[ERROR] Couldn't connect to DB!");
        process.exit(1);        
    }
    else {
        console.log("[SUCCESS] Connected to DB!")
    }

    // must start the server last
    this.startServer();
}

ClippyServer.prototype.startServer = function() {
    // starts the https server
    https.createServer(this.httpsOpts, this.server).listen(PORT);
    console.log("Listening on port: " + PORT);
}

// handles POST requests
ClippyServer.prototype.handlePost = function(req, res) {
    // for now, the posted data should be one json object we call "posted"
    var posted = req.body;        
    if (posted.type === 'clipboard_update') { // write to database
        clippyServer.writeToDB(posted.data, res);
    }
    else if (posted.type === 'get_clipboard') { // get clipboard from db
        clippyServer.getFromDB(posted.data, res);
    }
    else {
        res.end('Error: incorrect operation type');
    }
}

// handles get requests... might want to modify so db requests are GETs?
ClippyServer.prototype.get = function(req, res) {
    var credentials = '';
    req.on('data', function(chunk) {
        console.log(chunk.toString());
        credentials += chunk;
    });
    res.end("got your get lol");
}

// connect to the database
ClippyServer.prototype.dbConnect = function(keys) {
    this.db = require('orchestrate')(keys.ORCHESTRATE_KEY.toString());
    // check if we're connected:
    this.db.ping()
    .then(function() {
      // your key is VALID
      console.log("ORCHESTRATE_KEY: " + keys.ORCHESTRATE_KEY + 
        " [VALID]");
    })
    .fail(function (err) {
      // your key is INVALID
      console.log("ORCHESTRATE_KEY: " + keys.ORCHESTRATE_KEY +
        " [INVALID]");
      console.log(err);
    });
}

ClippyServer.prototype.getFromDB = function (credentials, server_res) {
    // need to do credential verification in here
    var user = credentials.user;
    var pass = credentials.pass;

    // if authentication passes, get the user's data:
    this.db.get('users', user)
    .then(function (res) {
        var clipboard = res.body.clipboard;
        console.log("User " + user + "'s clipboard is:");
        console.log(clipboard);
        server_res.end(JSON.stringify(clipboard));
    })
    .fail(function (err) {
        console.log("[Error in getFromDB]:");
        console.log(err);
        server_res.end("Retrieval failed: No such user found");
    });
}

ClippyServer.prototype.writeToDB = function(userData, server_res) {
    // will want some auth here too
    var user = userData.user;
    var newlyCopied = userData.copied;
    var that = this;

    // after authentication, put the new user in or append their new data
    this.db.put('users', user, {
        "name": user,
        "clipboard": [newlyCopied]
    }, false) // 'false' flag makes this a conditional put
    .then(function (result) {
        console.log(result.body);
        server_res.end("Inserted new user to database");
    })
    .fail(function (err) {
        console.log(err.body);
        if (err.body.code === 'item_already_present') {
            // not to worry, the user is already in the db, append new data
            that.appendToUser(user, newlyCopied, server_res);
        }
        else {
            server_res.end("User was not present, but there was some error " +
                "inserting him/her: " + err.body.toString());
        }
    });

}

// append user's newly copied data to their clipboard
ClippyServer.prototype.appendToUser = function (user, copied, server_res) {
    console.log("Attempting to append the new data...");
    this.db.newPatchBuilder('users', user)
    .append('clipboard', copied)
    .apply()
    .then(function(result) {
        // all patches were applied
        console.log("[SUCCESS] Appended \"" + copied + "\" to user " + user);
        server_res.end("User in db; appended \"" + copied + "\"");
    })
    .fail(function(err) {
        // not all patches were applied
        console.log("[FAILURE] Could not append \"" + copied 
            + "\" to user " + user);
        console.log(err.body);
        server_res.end("User was in db, but could not append new copy data");
    });
}

var clippyServer = new ClippyServer();