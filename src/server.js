#!/usr/bin/env node

// Test at: http://localhost:8080
// Set DEBUG=* for low-level socket-io debugging:
// DEBUG=* node server/twirlip-server.js

/* eslint-env node */
/*jslint node: true */

console.log("Twirlip7 server started: " + Date())

"use strict"

// Standard nodejs modules
var fs = require("fs")
var http = require("http")
var crypto = require("crypto")

var express = require("express")
var SocketIOServer = require("socket.io")

var dataDirectory = __dirname + "/../server-data/"
var storageExtension = ".txt"

var messageStorageQueue = []
var messageStorageTimeout = null

var streamToListenerMap = {}
var listenerToStreamsMap = {}
// TODO: var backloggedMessages = {}

var app = express()

var logger = function(request, response, next) {
    console.log("Request:", request.method, request.url)
    next()
}

app.use(logger)

app.use(express.static(__dirname + "/ui"))

// Create an HTTP service.
var server = http.createServer(app).listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Twirlip server listening at http://%s:%s", host, port, process.env.PORT, process.env.IP)
})

var io = new SocketIOServer(server)

io.on("connection", function(socket) {
    var clientId = socket.id
    console.log("\na user connected", clientId)
    
    socket.on("disconnect", function() {
        console.log("user disconnected", clientId)
    })
    
    socket.on("twirlip", function (message) {
        console.log("----- twirlip received message", clientId)
        processMessage(clientId, message)
    })
})

function sendMessage(message) {
    // console.log("sendMessage", JSON.stringify(message));
    // io.emit("twirlip", message); // This would send to all clients -- even ones not listening on stream
    var streams = streamToListenerMap[message.streamId]
    if (streams) {
        for (var clientId in streams) {
            if (streams[clientId]) {
                sendMessageToClient(clientId, message)
            }
        }
    }
}

function sendMessageToClient(clientId, message) {
    io.sockets.to(clientId).emit("twirlip", message)
}

function setListenerState(clientId, streamId, state) {
    var listeners = streamToListenerMap[streamId]
    if (!listeners) {
        listeners = {}
        streamToListenerMap[streamId] = listeners
    }
    
    if (state === undefined) {
        delete listeners[clientId]
    } else {
        listeners[clientId] = state
    }
    
    var streams = listenerToStreamsMap[clientId]
    if (!streams) {
        streams = {}
        listenerToStreamsMap[streamId] = streams
    }
 
    if (state === undefined) {
        delete streams[streamId]
    } else {
        streams[streamId] = state
    }
}

/* Commands for messages:
    listen -- start listening for messages after (optionally) getting all previous messages from a stream 
    unlisten -- stop getting messages from a stream
    insert -- add a message to a stream
    remove -- remove one specific message from a stream (or act as if that happened)
    reset -- remove everything stored in stream to start over (or act as if that happened)
*/

function processMessage(clientId, message) {
    var command = message.command
    if (command === "listen") {
        listen(clientId, message)
    } else if (command === "unlisten") {
        unlisten(clientId, message)
    } else if (command === "insert") {
        insert(clientId, message)
    } else if (command === "remove") {
        remove(clientId, message)
    } else if (command === "reset") {
        reset(clientId, message)
    //} else if (command === "directory") {
    //    directory(clientId, message)
    } else {
        console.log("unsupported command", command, message)
    }
}

function listen(clientId, message) {
    // TODO Handle only sending some recent messages or no previous messages
    var streamId = message.streamId
    
    console.log("\nlisten", clientId, streamId)
    
    setListenerState(clientId, streamId, "listening")
    
    var fileName = getStorageFileNameForMessage(message)

    // TODO: Make this asynchronous
    // TODO: Also  if asynchronous, maybe queue new messages for a client for sending later until this is done to preserve order
    function sendMessage(messageString) {
        // TODO: Handle errors
        var message = JSON.parse(messageString)
        // console.log("listen sendMessage", clientId, message)
        sendMessageToClient(clientId, message)
    }
    try {
        var fdMessages = fs.openSync(fileName, "r")
    } catch (e) {
        // No file, so no saved data to send
        return
    }
    try {
        forEachLine(fdMessages, sendMessage)
    } finally {
        // TODO Check error result
        fs.closeSync(fdMessages)
    }
}

function unlisten(clientId, message) {
    var streamId = message.streamId
    console.log("\nunlisten (unfinished)", streamId)
    setListenerState(clientId, streamId, undefined)
}

function insert(clientId, message) {
    var streamId = message.streamId
    console.log("\ninsert", clientId, streamId, calculateSha256(message.item))
    storeMessage(message)
    sendMessage(message)
}

function remove(clientId, message) {
    var streamId = message.streamId
    console.log("\nremove (unfinished)", streamId)
    storeMessage(message)
    sendMessage(message)
}

function reset(clientId, message) {
    var streamId = message.streamId
    console.log("\nresed", streamId)
    // TODO: Perhaps should clear out file?
    storeMessage(message)
    sendMessage(message)
}
   
// File reading and writing

function calculateSha256(value) {
    var sha256 = crypto.createHash("sha256")
    sha256.update(value, "utf8")
    var result = sha256.digest("hex")
    return result
}

function getStorageFileNameForMessage(message) {
    var streamId = message.streamId
    var hash = calculateSha256(streamId)
    return dataDirectory + hash + storageExtension
}

// TODO: Could schedule up to one active write per file for more throughput...
function writeNextMessage() {
    if (!messageStorageQueue.length) return
    var message = messageStorageQueue.shift()
    var lineToWrite = JSON.stringify(message) + "\n"
    var fileName = getStorageFileNameForMessage(message)
    // TODO: Do we need to datasync to be really sure data is written?
    fs.appendFile(fileName, lineToWrite, function (err) {
        if (err) {
            console.log("Problem writing file", err)
            return
        }
        scheduleMessageWriting()
    })
}

function scheduleMessageWriting() {
    if (!messageStorageTimeout) {
        messageStorageTimeout = setTimeout(function () {
            messageStorageTimeout = null
            writeNextMessage()
        }, 0)
    }
}

function storeMessage(message) {
    messageStorageQueue.push(message)
    scheduleMessageWriting()
}

// From: http://stackoverflow.com/questions/7545147/nodejs-synchronization-read-large-file-line-by-line#7545170
function forEachLine(fd, callback, maxLines) {
    var bufSize = 64 * 1024
    var buf = new Buffer(bufSize)
    var leftOver = ""
    var lineNum = 0
    var lines
    var n

    while ((n = fs.readSync(fd, buf, 0, bufSize, null)) !== 0) {
        lines = buf.toString("utf8", 0 , n).split("\n")
        // add leftover string from previous read
        lines[0] = leftOver + lines[0]
        while (lines.length > 1) {
            // process all but the last line
            callback(lines.shift(), lineNum)
            lineNum++
            if (maxLines && maxLines >= lineNum) return
        }
        // save last line fragment (may be "")
        leftOver = lines.shift()
    }
    if (leftOver) {
        // process any remaining line
        callback(leftOver, lineNum)
    }
}
