// Function to split file into chunks using ArrayBuffer
function splitFile(file, chunkSize, callback, offset = 0) {
  return new Promise((resolve, reject) => {
    let sequencenumber = 0;

    function readNextChunk() {
      // Check if we've reached the end of the file
      if (offset >= file.size) {
        resolve(); // Resolve when done
        return;
      }

      // Slice the next chunk from the file
      const chunk = file.slice(offset, offset + chunkSize);

      const fileReader = new FileReader();
      fileReader.onload = function (event) {
        const arrayBuffer = event.target.result;

        // Increment sequence number and invoke the callback
        sequencenumber++;
        if (callback) {
          callback(arrayBuffer, sequencenumber);
        }

        // Move the offset forward and read the next chunk
        offset += chunkSize;
        readNextChunk();
      };

      fileReader.onerror = function (error) {
        reject(error); // Reject on error
      };

      // Read the current chunk
      fileReader.readAsArrayBuffer(chunk);
    }

    // Start reading chunks
    readNextChunk();
  });
}


// https://gist.github.com/72lions/4528834
function mergeBuffers(buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

let chunkMemory = [];

function reconstructFile(blob, callback) {
        const reader = new FileReader();

        reader.onload = () => {
            const arrayBuffer = reader.result;

            // Extract metadata and file content
            try {
                const [metadata, fileDataBuffer] = extractMessageBuffer(arrayBuffer);

                    if(!chunkMemory[metadata.fileID]) {
                        chunkMemory[metadata.fileID] = [];
                    }
                    chunkMemory[metadata.fileID][metadata.sequencenumber] = fileDataBuffer;
                    callback(metadata);

            } catch (error) {
                console.error(error);
            }
        };

        reader.onerror = () => reject(reader.error);

        reader.readAsArrayBuffer(blob); // Read blob as ArrayBuffer
    };


function extractMessageBuffer(messageBuffer) {
    const view = new DataView(messageBuffer);

    // Find the metadata length by searching for the null byte
    let metadataLength = 0;
    while (metadataLength < messageBuffer.byteLength && view.getUint8(metadataLength) !== 0) {
        metadataLength++;
    }

    if (metadataLength === messageBuffer.byteLength) {
        throw new Error("Null byte delimiter not found. Ensure metadata ends with '\\0'.");
    }

    // Extract metadata and binary data
    const metadataBuffer = messageBuffer.slice(0, metadataLength);
    const metadataString = new TextDecoder().decode(metadataBuffer);

    // Parse JSON safely
    let metadata;
    try {
        metadata = JSON.parse(metadataString);
    } catch (err) {
        throw new Error(`Invalid JSON in metadata: ${err.message}`);
    }

    const binaryDataBuffer = messageBuffer.slice(metadataLength + 1); // Skip the null byte
    return [metadata, binaryDataBuffer];
}

async function createFile(z, v) {
    try {
            const totalLength = chunkMemory[z].reduce((sum, buffer) => sum + buffer.byteLength, 0);
            const concatenatedBuffer = new Uint8Array(totalLength);

            let offset = 0;
            chunkMemory[z].forEach(buffer => {
                concatenatedBuffer.set(new Uint8Array(buffer), offset);
                offset += buffer.byteLength;
                delete buffer; // Cleanup Operation #1
            });

        // Create Blob and File objects
        const file = new File([concatenatedBuffer], v, { type: 'application/octet-stream' });
        delete concatenatedBuffer; // Cleanup Operation #3
        delete blob; // Cleanup Operation #4

        // Download the file
        const link = document.createElement('a');
        const url = URL.createObjectURL(file);
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);  // Append to DOM to ensure the click works on all browsers
        link.click();
        document.body.removeChild(link);   // Cleanup Operation #5
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error creating file:", error);
    }
}

async function createFileUsingWorker(z, v) {
    chunkMemory[z].shift();
    const chunks = chunkMemory[z];
    const blob = new Blob(chunks, { type: 'application/octet-stream' });
    const file = new File([blob], v, { type: 'application/octet-stream' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = v;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
