function splitFile(file, chunkSize, callback) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const fileReader = new FileReader();

    fileReader.onload = function (event) {
      const base64String = event.target.result.split(",")[1]; // Remove metadata
      let sequenceNumber = 0;

      for (let i = 0; i < base64String.length; i += chunkSize) {
        const chunk = base64String.slice(i, i + chunkSize);
        var isLastChunk = (i + chunkSize) >= base64String.length;
        chunks.push(chunk);

        // Call the callback with the current chunk and its sequence number
        if (callback) {
          callback(chunk, sequenceNumber, isLastChunk);
        }

        sequenceNumber++;
      }

      resolve(chunks);
    };

    fileReader.onerror = function (error) {
      reject(error);
    };

    fileReader.readAsDataURL(file);
  });
}

// Initialize chunk storage
var chunkStorage = {};

function handleChunks(msg, callback) {

    // Initialize storage for each fileID
    if(!msg.signal) {
      
      if (!chunkStorage[msg.chunk.fileID]) {
        chunkStorage[msg.chunk.fileID] = {
            chunks: [],
            receivedCount: 0
        };
      }

    // Store the chunk in the correct order
      chunkStorage[msg.chunk.fileID].chunks[msg.chunk.sequenceNumber] = msg.message;
      chunkStorage[msg.chunk.fileID].receivedCount++;
      callback(msg.chunk.sequenceNumber, msg.fileSize);
    } else {
      let d = chunkStorage[msg.chunk.fileID];
      d.chunks[d.length + 1] = msg.message;
        // Join the chunks without any prefix or extra separators
        const fullBase64 = chunkStorage[msg.chunk.fileID].chunks.join('');
        memory[msg.chunk.fileID] = fullBase64;
        // Clean up after reassembly
        delete chunkStorage[msg.chunk.fileID];
                    anim(document.getElementById(`${msg.chunk.fileID}`), 100, 750);
                    let p = document
                        .getElementById(`${msg.chunk.fileID}`)
                        .parentElement.parentElement.querySelectorAll('#sendBtn');
                        p.forEach(btn => {
                            btn.style.display = 'block';
                        });
    }
}
