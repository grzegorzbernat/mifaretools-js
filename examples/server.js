var app = require('express')();
var server = require('http').createServer(app);
var ndef = require('ndef');
var mifaretools = require('..');

server.listen(8080);
console.log("Listening for new clients on port 8080");

app.get('/', function(request, response) {
    response.send('Reading constantly');
    setInterval(function() {
        mifaretools.read(function(err, uid, data) {
            if (uid != undefined && uid != null) {
                console.log("UID: " + uid);
            }
            if (err != undefined && err != null) {
				console.log("Error: " + err.replace(/\n$/, ""));
              //  console.log(new Error(err.replace(/\n$/, "")));
            }
            if (data != undefined && data != null) {
                var message = ndef.decodeMessage(data.toJSON().data);
                console.log("Found NDEF message with " + message.length +
                    (message.length === 1 ? " record" : " records"));
                console.log(ndef.stringify(message));
            }
        });
    }, 1000);
});

app.get('/format', function(request, response) {
    response.send('Formatting...');
    mifaretools.format(function(err) {
        if (err) {
          console.error(new Error(err.replace(/\n$/, "")));
        } else {
            console.log("Format completed");
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
            var message = ndef.decodeMessage(data.toJSON());
            console.log("Found NDEF message with " + message.length +
                (message.length === 1 ? " record" : " records"));
            console.log(ndef.stringify(message));
        }
    });
});
