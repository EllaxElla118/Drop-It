async function getIP() {
    return new Promise((resolve, reject) => {
    fetch("https://jsonip.com/")
        .then(response => response.json())
        .then(data => {
            resolve(data.ip);
        })
        .catch(error => function(){reject(error);console.error("Error fetching IP:", error)});
    });
}

async function sendIPData() {
        let ip = await getIP()
        let temp_msg = {
            type: 'ip',
            ip: ip,
            id: senderID
        }
        const msgJSON = JSON.stringify(temp_msg);
        const metadataBuffer = new TextEncoder().encode(msgJSON + "\0");
        let t = new ArrayBuffer(8);
        let z = mergeBuffers(metadataBuffer.buffer, t);  
        ws.send(z);
}