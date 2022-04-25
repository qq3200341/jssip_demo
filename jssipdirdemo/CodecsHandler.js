// CodecsHandler.js


function movePayloadTypesToFront(preferredPayloadTypes, mLine) {
    // The format of the media description line should be: m=<media> <port> <proto> <fmt> ...
    var origLineParts = mLine.split(" ");
    if (origLineParts.length <= 3) {
        console.log("Wrong SDP media description format: " + mLine);
        return null;
    }
    var header = origLineParts.slice(0, 3);
    var unpreferredPayloadTypes = origLineParts.slice(3, origLineParts.length);
    for (var i = 0; i < unpreferredPayloadTypes.length; ++i) {
        for (var j = 0; j < preferredPayloadTypes.length; ++j) {
            if (unpreferredPayloadTypes[i] == preferredPayloadTypes[j]) {
                unpreferredPayloadTypes.splice(i, 1);
                break;
            }
        }
    }
    // Reconstruct the line with `preferredPayloadTypes` moved to the beginning of the payload
    // types.
    var newLineParts = new Array();;
    newLineParts = newLineParts.concat(header);
    newLineParts = newLineParts.concat(preferredPayloadTypes);
    newLineParts = newLineParts.concat(unpreferredPayloadTypes);
    return newLineParts.join(" ")
}

function preferCodec(sdpString, codec, isAudio) {
    var lines = sdpString.split("\r\n");
    var mLineIndex = findMediaDescriptionLine(isAudio, lines);
    if (mLineIndex == -1) {
        console.log("No mediaDescription line, so can't prefer " + codec);
        return sdpString;
    }
    // A list with all the payload types with name |codec|. The payload types are integers in the
    // range 96-127, but they are stored as strings here.
    var codecPayloadTypes = new Array();
    // a=rtpmap:<payload type> <encoding name>/<clock rate> [/<encoding parameters>]
    var regexStr = "^a=rtpmap:(\\d+) " + codec + "(/\\d+)+[\r]?$";

    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];
        var result = line.match(regexStr);
        if (result != null && result.length > 0) {
            codecPayloadTypes.push(result[1]);
        }
    }
    if (codecPayloadTypes.length <= 0) {
        console.log("No payload types with name " + codec);
        return sdpString;
    }

    var newMLine = movePayloadTypesToFront(codecPayloadTypes, lines[mLineIndex]);
    if (newMLine.length == 0) {
        return sdpString;
    }
    console.log("Change media description from: " + lines[mLineIndex] + " to " + newMLine);
    lines[mLineIndex] = newMLine;
    return lines.join("\r\n");
}

function findMediaDescriptionLine(isAudio, sdpLines) {
    var mediaDescription = isAudio ? "m=audio " : "m=video ";
    for (var i = 0; i < sdpLines.length; ++i) {
        var line = sdpLines[i];
        if (line.startsWith(mediaDescription)) {
            return i;
        }
    }
    return -1;
}