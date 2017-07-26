var fs = require('fs');
var fileName = 'ndef.bin';
var ndef = require('ndef');

function getUID(text) {
    var regex = /^.*? with UID ([a-f0-9]+)/; //regex expression to extract UID from string like "Found Mifare Classic 1k with UID 564ecb50."
    var result = text.match(regex);
    if (result != undefined && result != null) {
        return result[1];
    }
	else
	{
		return undefined;
	}
}

function read(callback) {
    var spawn = require('child_process').spawn;
    var temp = require("temp").track();
    var fileName = temp.path({
        suffix: '.bin'
    });
    var command = spawn('mifare-classic-read-ndef', ['-y', '-o', fileName]);
    var result = '';
    var uid = '';
    var errorMessage = '';

    command.stdout.on('data', function(data) {
        result += data.toString();
    });

    command.stderr.on('data', function(data) {
        errorMessage += data.toString();
    });

    command.on('close', function(code) {
        if (result.indexOf('Found') === -1) {
            errorMessage = "No TAG found.";
        }
        uid = getUID(result);
        if (code === 0 && errorMessage.length === 0) {
            fs.readFile(fileName, function(err, data) {
                callback(err, uid, data);
            });
        } else {
            callback(errorMessage, uid);
        }
        fs.unlinkSync(fileName);
    });
}

function format(callback) {
    var errorMessage = '';
    var spawn = require('child_process').spawn;
    var command = spawn('mifare-classic-format', ['-y']);

    command.stdout.on('data', function(data) {
        process.stdout.write(data + "");
    });
    
    command.stderr.on('data', function(data) {
        errorMessage += data;
    });

    command.on('close', function(code) {
        if (code === 0) {
            callback(null);
        } else {
            callback(errorMessage);
        }
    });
}

module.exports = {
    read: read,
    format: format
};