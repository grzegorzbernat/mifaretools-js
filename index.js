var fs = require('fs');
var ndef = require('ndef');
var spawn = require('child_process').spawn;

/**
 * Function to get UID number from result of reading tag.
 * @param data result of read function
 * @returns tag UID
 */
function getUID(data) {
    var regex = /^.*? with UID ([a-f0-9]+)/; //regex expression to extract UID from string like "Found Mifare Classic 1k with UID 564ecb50."
    var result = data.match(regex);
    if (result != undefined && result != null) {
        return result[1];
    }
}

/**
 * Function to read mifare classic tags
 * callback(error, uid, data) if successful returns uid number and raw tag data
 * callback(error, uid) when tag has no content
 * @param callback function
 */
function read(callback) {
    var temp = require("temp").track();
    var fileName = temp.path({
        suffix: '.bin'
    });
    var command = spawn('mifare-classic-read-ndef', ['-y', '-o', fileName]);

    var result = '';
    var uid = '';
    var errorMessage = '';

    command.on('error', function (err) {
        errorMessage = "Cannot spawn program. Are you sure that libfreefare is installed?";
    });

    command.stdout.on('data', function (data) {
        result += data.toString();
    });

    command.stderr.on('data', function (data) {
        errorMessage += data.toString();
    });

    command.on('close', function (code) {
        if (errorMessage.length > 0) {
            try {
                uid = getUID(result);
            } catch (e) {
                callback(errorMessage);
            }

            callback(errorMessage.replace(/\n$/, ""), uid);
        }
        else {
            if (result.indexOf('Found') === -1) {
                errorMessage = "No TAG found.";
            }
            uid = getUID(result);
            if (code === 0 && errorMessage.length === 0) {
                fs.readFile(fileName, function (err, data) {
                    callback(err, uid, data);
                });
            } else {
                callback(errorMessage.replace(/\n$/, ""), uid);
            }
            fs.unlinkSync(fileName);
        }
    });
}

/**
 * Function to format tag content
 * @param callback null or error message
 */
function format(callback) {
    var errorMessage = '';
    var command = spawn('mifare-classic-format', ['-y']);

    command.on('error', function (err) {
        errorMessage = "Cannot spawn program. Are you sure that libfreefare is installed?";
    });

    command.stdout.on('data', function (data) {
        process.stdout.write(data + "");
    });

    command.stderr.on('data', function (data) {
        errorMessage += data;
    });

    command.on('close', function (code) {
        if (code === 0) {
            callback(null);
        } else {
            callback(errorMessage.replace(/\n$/, ""));
        }
    });
}

/**
 * Function to write NDEF contant into mifare classic tag.
 * @param data byte array of ndef data
 * @param callback function
 */
function write(data, callback) {
    var errorMessage = '';
    var result = "";
    var buffer = Buffer(data);

    var temp = require("temp").track();
    var fileName = temp.path({
        suffix: '.bin'
    });

    fs.writeFile(fileName, buffer, function (err) {

        var command = spawn('mifare-classic-write-ndef', ['-y', '-i', fileName]);

        command.on('error', function (err) {
            errorMessage = "Cannot spawn program. Are you sure that libfreefare is installed?";
        });


        if (err) {
            callback(err);
        }

        command.stdout.on('data', function (data) {
            process.stdout.write(data + "");
            result += data;
        });

        command.stderr.on('data', function (data) {
            errorMessage += data;
        });

        command.on('close', function (code) {
            if (errorMessage.length > 0) {
                callback(errorMessage);
            }
            else {
                if (result.indexOf('Found') === -1) {
                    errorMessage = "No TAG found.";
                }

                if (code === 0 && errorMessage.length === 0) {
                    callback(null);
                    fs.unlinkSync(fileName);
                } else {
                    callback(errorMessage.replace(/\n$/, ""));
                }
            }
        });
    });
}

module.exports = {
    read: read,
    write: write,
    format: format
};
