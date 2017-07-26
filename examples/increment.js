var app = require('express')();
var server = require('http').createServer(app);
var ndef = require('ndef');
var mifaretools = require('..');

server.listen(8080);
console.log("Listening for new clients on port 8080");

app.get('/writeInitial', function(request, response) {
    response.send('Writing...');

    var message = [
        ndef.textRecord("0")
    ];

    var bytes = ndef.encodeMessage(message);

    mifaretools.write(bytes, function(err) {
        if (err) {
            console.error(new Error(err.replace(/\n$/, "")));
        } else {
            console.log("Writing completed");
        }
    });
});

app.get('/read', function(request, response) {
    response.send('Reading...');

    mifaretools.read(function(err, uid, data) {
        if (uid != undefined && uid != null) {
            console.log("UID: " + uid);
        }
        if (err != undefined && err != null) {
            console.error(new Error(err.replace(/\n$/, "")));
        }
        if (data != undefined && data != null) {
            var message = ndef.decodeMessage(data.toJSON().data);
            console.log("Found NDEF message with " + message.length +
                (message.length === 1 ? " record" : " records"));
            console.log(ndef.stringify(message));
            if(message.length > 0)
            {
                var payload = ndef.text.decodePayload(message[0].payload);
                console.log(payload);
            }
        }
    });
});

app.get('/increment', function(request, response) {
    response.send('Reading...');
    var payload;
    mifaretools.read(function(err, uid, data) {
        if (err != undefined && err != null) {
            console.error(new Error(err.replace(/\n$/, "")));
        }

        if (data != undefined && data != null) {
            var message = ndef.decodeMessage(data.toJSON().data);

            if(message.length > 0)
            {
                payload = ndef.text.decodePayload(message[0].payload);
                console.log(payload);
            }
        }
    });

    var number = parseInt(payload);
    number = number + 1;

    var message = [
        ndef.textRecord(number +"")
    ];

    var bytes = ndef.encodeMessage(message);

    mifaretools.write(bytes, function(err) {
        if (err) {
            console.error(new Error(err.replace(/\n$/, "")));
        } else {
            console.log("Writing completed");
        }
    });

});