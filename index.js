var imgPath = '';
let template;
const errorCodes =  [
    'Server has crashed',
    'Invalid UUID or Receiver has lost connection'
]

let sessionID = '';
let senderID = '';
let pause_switch = {};

document.addEventListener("DOMContentLoaded", function() {
    setInterval(updateRecUI,500);
    draggable(document.querySelector('#id_div'));
    /* Feature will be added in future release
  document.querySelector('#webID').addEventListener('input', function() {
      if(this.value.length === 6) {
          setTimeout(function() {
            swapTo(4);
            joinWeb(this.value);
          }, 1000)
      }
    });
    */
    /*setInterval(function(){
        document.querySelector('.infoPanel').style.display = 'none';
    }, 2000) */



let o = ['dragend', 'dragleave', 'dragstart', 'dragenter', 'dragover', 'drop'];

for (let eventType of o) {
    document.addEventListener(eventType, function (e) {
        e.stopPropagation();
        e.preventDefault();
        switch (eventType) {
            case 'drop':
                let files = e.dataTransfer?.files;
                console.log(files);
                let dataTransfer = new DataTransfer();

                // Convert FileList to array and filter valid files
                Array.from(files).forEach(file => {
                    if (file.size > 0) { // Exclude folders (size === 0)
                        dataTransfer.items.add(file);
                    }
                });

                if (dataTransfer.files && dataTransfer.files.length > 0) {
                    // Assign valid files to the input element
                    let fileInput = document.querySelector('#file');
                    fileInput.files = dataTransfer.files;

                    // Manually trigger change event
                    const event = new Event('change', { bubbles: true });
                    fileInput.dispatchEvent(event);

                    sendInfo('mild', 'Processing files...', 0.3);
                } else {
                    sendInfo('error', 'No valid files found...', 2);
                }
                break;

            case 'dragover':
                sendInfo('mild', 'Drop the file(s) anywhere');
                break;

            case 'dragleave':
                sendInfo('mild', 'Drop the file(s) anywhere', 0.1);
                break;
        }
    }, true);
}
});

window.addEventListener("DOMContentLoaded", (event) => {
    template = document.querySelector('.recFiles');
    reconnect();
    document.getElementById('file').addEventListener('change', (event) => {
        idSelector();
    });
});

window.addEventListener('load', (event) => {
    document.getElementById('addBtn').addEventListener('click', (event) => {
        openFilePicker();
    });
});

function openFilePicker() {
    document.getElementById('file').click();
}

function nfncts_close() {
        document.getElementById('id_div').classList.remove('active');
        document.querySelector('.qrScanner').style.display = 'none';
        document.querySelector('#overlay').style.display = 'none';
}

async function send(r) {
     let id = document.getElementById('in_id').value;
     if(id.length != 6 || id.search(/[^a-zA-Z0-9]/) >= 0) {
         sendInfo('mild', 'Wrong ID Format!!!', 1);
         return;
     }
    document.querySelector('#sBtn').innerHTML = "<img style='width: 18%' src='resources/imgs/spinner1.svg' />";
    document.querySelector('#sBtn').disabled = 'true';
    document.querySelector('#sBtn').style.backgroundColor = 'white';
    document.querySelector('#sBtn').style.border = '2px solid green';
    setTimeout(function() {
        document.getElementById('id_div').classList.remove('active');
        document.querySelector('#overlay').style.display = 'none';
        document.querySelector('#sBtn').innerHTML = "Send";
        document.querySelector('#sBtn').disabled = 'false';
        document.querySelector('#sBtn').style.backgroundColor = '#4CAF50';
        document.querySelector('#sBtn').style.border = '2px solid white';
    }, 1000);
    let chunkSize = 1024 * 50;
   const fileInput = document.querySelector('#file');
   const files = r || fileInput.files;

    for (let x = 0; x < files.length; x++) {
        const file = files[x];
        let fileID = Math.floor((10**5) + Math.random() * (9 * (10**5)));
        let isLargeFile = file.size > 1024 * 1024 * 300;
        pause_switch[fileID] = false;
        splitFile(
            file,                      
            chunkSize,                     
            async(chunk, sequencenumber) => {
                const message = {
                    sender: senderID,
                    type: 'file',
                    targetClientId: id,
                    fileName: file.name,
                    fileSize: file.size,
                    fileID: fileID,
                    sequencenumber: sequencenumber,
                    isLargeFile: isLargeFile,
                };
                const msgJSON = JSON.stringify(message);
                const metadataBuffer = new TextEncoder().encode(msgJSON + "\0");
                let z = mergeBuffers(metadataBuffer.buffer, chunk);
                if(ws && !pause_switch[fileID]) {
                    ws.send(z);
                } else {
                    return;
                }
                th = Math.floor((sequencenumber * 100) * (Math.ceil(file.size / (1024 * 50))**-1));
                // document.querySelector('.sNote').innerHTML = files.length > 1 ? (`Sending ${files.length} files`) : (th === 100 ? '' : `${th}%`);
                sendInfo('mild', files.length > 1 ? (`Sending ${files.length} files`) : (th === 100 ? '' : `${th}%`));
                if(th != 100) return;
                document.querySelector('.infoPanel').style.display = 'none';
                pause_switch[fileID] = null;
            });
    };
}

function idSelector() {
    document.getElementById('id_div').classList.add('active');
    document.getElementById('overlay').style.display = 'block';
}

function incomingFile(servedfileName, id, w, size, d) {
    let ext = servedfileName.split('.').pop();
    let a = template.cloneNode(true);
    a.setAttribute('id', id);
    if(!w) {
        a.querySelector('.dBtn').onclick = function() {
            this.value = 'Saving...';
            setTimeout(async function() {
                await createFile(id, servedfileName);
                deleteEntry(id); 
            }, 1000);
            trimMemoryBlocks(id); 
            sendInfo('mild', `File successfully downloaded, Please&nbsp;&nbsp;<a target='_blank' href="https://www.buymeacoffee.com/supportella">Donate</a>`, 5);
        }
    } else{
        a.querySelector('.dBtn').onclick = async function() {
            this.value = 'Saving...';
            setTimeout(async function() {
                await createFileUsingWorker(id, servedfileName);
                deleteEntry(id);
            }, 1000);
            trimMemoryBlocks(id); 
            sendInfo('mild', `File successfully downloaded, Please&nbsp;&nbsp;<a target='_blank' href="https://www.buymeacoffee.com/supportella">Donate</a>`, 5);
        }
    }
    a.querySelector('.deleteBtn').onclick = async function() {
        this.value = 'Deleting...';
        setTimeout(function() {
            deleteEntry(id);
            trimMemoryBlocks(id);       
        }, 500);
    }
    a.querySelector('.cancelBtn').onclick = async function() {  
        reqCancel(id, d); 
        this.value = 'Rejecting...';
    }
    let f = ['gif', 'apng', 'jpg', 'png', 'svg'];
    let i=0;while(i<f.length){if(ext===f[i]){f=f[i];break;}else{i++}}
    if(typeof f==='string'){a.ext=f[i];a.displayable = true}else{a.displayable = false}
    if(servedfileName.replace('.' + ext).length > 20) { a.querySelector('#FileName').textContent = servedfileName.slice(0,16) + '∙∙∙.' + ext;   }
    else {  a.querySelector('#FileName').textContent = servedfileName;   }; 
    const t_1 = [1, 1024, 1024 * 1024, 1024 * 1024 * 1024];
    const t_2 = ['bytes', 'kb', 'mb', 'gb'];
    let r = () => {
        let i = 0;
        while(size>t_1[i] && i<t_1.length) {
            i++
        }
        return `${(size/t_1[i-1]).toFixed(2)}${t_2[i-1]}`
    }
    a.querySelector('#FileSize').textContent = r();
    document.body.appendChild(a);  
    draggable(a);
    setTimeout(function(){a.classList.add('active')},500);
}

memory = [];
let memory_block_2 = [];
let memory_block_3 = [];

// wss://don-m0rx.onrender.com/ //
let SERVER_URI = 'ws://127.0.0.1:2104';
let reconnectTries = 0;
let ws;

function reconnect() {
    if(reconnectTries > 10) {
        sendInfo('wild', "Couldn't re-stablish the connection, please refresh the page...");
        return;
    }
    reconnectTries += 1;
    let c = sessionID != '' ? `?key=${sessionID}` : '';
    ws = new WebSocket(`${SERVER_URI}${c}`); 
    ws.onerror = () => {ws.close();sendInfo('mild', 'Reconecting...');reconnect()}
    ws.onclose = () => {ws.close();sendInfo('mild', 'Reconecting...');reconnect()}
    ws.onopen = () => {
        document.querySelector('.load_overlay').style.display = 'none';   
        document.querySelector('#overlay').style.display = 'none';
        document.querySelector('.infoPanel').style.display = 'none';
        reconnectTries = 0;        
    };
    ws.onmessage = async(message) => {
        if(message.data instanceof Blob) { 
                reconstructFile(message.data, async(r) => {
                    let cCalc = Math.floor((r.sequencenumber * 100) * (Math.ceil(r.fileSize / (1024 * 50))**-1));
                    function fileId(fileId) { return fileId === r.fileID  }
                    if(!memory_block_2.find(fileId)) {
                        incomingFile(r.fileName, r.fileID, r.isLargeFile, r.fileSize, r.sender);
                        memory_block_2.push(r.fileID);  
                    } else {  
                        document.getElementById(`${r.fileID}`).querySelector('.progress').innerText = `${cCalc}%`;
                    }
                    if(cCalc === 100) {
                        let v = document.getElementById(`${r.fileID}`);
                        v.querySelector('.progress').innerText = '';
                        v.querySelector('.dBtn').style.backgroundColor = '#4CAF50';
                        v.querySelector('.dBtn').style.cursor = 'pointer';
                        v.querySelector('.dBtn').disabled = false;
                        memory_block_3.push({ [r.fileID]: r.fileName });   
                        v.querySelector('.cancelBtn').style.display = 'none'; 
                        v.querySelector('.deleteBtn').style.display = 'block';
                        if(v.displayable) {
                        v.querySelector('.recImg').src = await u();
                            function u() {
                                let t = '';
                                if(r.fileSize < 1024*1024*6) {
                                    let u = chunkMemory[r.fileID];
                                    u.shift();
                                    const blob = new Blob(u, { type: 'application/octet-stream' });
                                    t = URL.createObjectURL(blob);
                                } else {t = 'resources/imgs/fileLarge.jpg';}
                                return t;
                            };
                        } else{v.querySelector('.recImg').src = 'resources/imgs/unsupportFileformat.jpg'}
                        v.querySelector('.recImg').style.maxHeight = '100%';
                        v.querySelector('.recImg').style.maxWidth = '100%';
                    };
                });
        } else {  
            let msg = await JSON.parse(message.data);    
            if(msg.type === 'id') {   
                document.getElementById('id').innerText = msg.message;
                sessionID = msg.sessID;                    
                senderID = msg.message;                    
                appendQR(msg.message);
             }
            else if(msg.type === 'client_list') {

            }
            else if(msg.type === 'cancelFile') {
                pause_switch[msg.fileID] = true;
                sendInfo('mild', 'File transfer was aborted by other device...', 2)
                let temp_msg = {
                    type: 'cancelFileAccepted',
                    from: msg.from,
                    fileID: msg.fileID
                }
                const msgJSON = JSON.stringify(temp_msg);
                const metadataBuffer = new TextEncoder().encode(msgJSON + "\0");
                let t = new ArrayBuffer(8);
                let z = mergeBuffers(metadataBuffer.buffer, t);
                ws.send(z);
            } else if(msg.type === 'Error') {
                if(msg.code === 1) {
                    pause_switch[msg.fileID] = true;
                }
                sendInfo('mild', errorCodes[msg.code], 3);
            } else if(msg.type === 'QRAccept') {
                acceptedQR(msg.message);
            } else if(msg.type === 'cancelFileAccepted') {   
                deleteEntry(msg.fileID);
                chunkMemory[msg.fileID] = [];
                trimMemoryBlocks(msg.fileID);    
            } 
    };
};
}

    function lerp(start, end, t) {
  return start + (end - start) * t;
}

function anim(progressElement, end, duration = 1000, callback = () => {}) {
  // Extract the current flex-grow value or set to 0
  let computedStyle = getComputedStyle(progressElement);
  let start = parseFloat(computedStyle.flexGrow) || 0;

  // Normalize end to a ratio (0 to 1) since flex-grow values are not percentages
  end = end / 100;

  let startTime = performance.now();

  function animate(currentTime) {
    let elapsed = currentTime - startTime;
    let t = Math.min(elapsed / duration, 1); // Normalized time (0 to 1)

    // Calculate the current flex-grow value using linear interpolation
    let currentGrow = lerp(start, end, t);
    progressElement.style.flexGrow = `${currentGrow}`;

    if (t < 1) {
      requestAnimationFrame(animate); // Continue animating until completion
    } 
  }

  requestAnimationFrame(animate);
}

// Linear interpolation function
function lerp(start, end, t) {
  return start + (end - start) * t;
}

function isJson(str) { try { JSON.parse(str); } catch (e) { return false; } return true; }

function progessCalc(a,b) {
    const t_1 = [1024, 1024 * 1024, 1024 * 1024 * 1024]; // Thresholds for kb, mb, gb
    const t_2 = ['kb', 'mb', 'gb']; // Units for thresholds
        // Determine appropriate unit
        let i = 0;
        while (b > t_1[i] && i < t_1.length - 1) {
            i++;
        }
    return `${((a*1024*50)/t_1[i-1]).toFixed(1)}${t_2[i-1]}/${((b)/t_1[i-1]).toFixed(1)}${t_2[i-1]}`;
}

function sendInfo(level = 'mild', info = 'An unknown Error occurred', time) {
    let r = document.querySelector('.infoPanel');
    if(level === 'wild') {
        document.querySelector('.load_overlay').innerHTML = info;
        document.querySelector('.load_overlay').style.display = 'flex';
    } else {
        r.style.display = 'flex';
        r.innerHTML = info;
    }
    if(time) {
        setTimeout(function(){
            r.style.display = 'none';
        }, time*1000)
    }
}

async function appendQR(id) {
    const qrCode = new QRCodeStyling({
        width: 200,
        height: 200,
        type: "svg",
        data: `{
            "ifo": "Visit DropIt and Scan this QR with the DropIt Scanner to receive the file(s)",
            "uuid": ${id}
        }`,
        dotsOptions: {
            color: "green",
            type: "rounded"
        },
        backgroundOptions: {
            color: "white",
        },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 20
        }
    });
    await qrCode.download();
    document.querySelector('.qrImg').src = document.querySelector('#qr').src;
    document.querySelector('#qr').remove();
}

function acceptedQR(s) {
    document.querySelector('#in_id').value = s;
    document.querySelector('#sBtn').click();
}

async function dall() {
    const zip = new JSZip();
    let w = await fetch('resources/ad.txt').then(w=>w.text());
    zip.file('ad.txt',w);
    for (const a of memory_block_3) {
        for (const [id, fileName] of Object.entries(a)) {
            let r = chunkMemory[id].filter(r => {return r;})
            const file = new File(r, fileName, { type: 'application/octet-stream' });
            await zip.file(fileName, file);
            chunkMemory[id] = [];
            trimMemoryBlocks(id);
            deleteEntry(id);
        }
    }
    const zipData = await zip.generateAsync({type: "blob",streamFiles: true});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipData);
    link.download = `Files from DropIt.zip`;
    link.click();
}

function trimMemoryBlocks(id) {
    let s = '';
    if(typeof id === 'string') {  s = JSON.parse(id);  }
    else {s=id}
    let y = [];
    memory_block_3.forEach(c=>
    {
        if(Object.entries(c)[0][0]!=JSON.stringify(s)) {   y.push(c)   }
    });
    memory_block_3 = y;
    memory_block_2 = [...memory_block_2.filter(n => {return n != s})];
} 

function reqCancel(a,b) {
    let msg = {
        type: 'cancelRequest',
        id: a,
        sender: b,
        receiver: senderID
    }
    const msgJSON = JSON.stringify(msg);
    const metadataBuffer = new TextEncoder().encode(msgJSON + "\0");
    let t = new ArrayBuffer(8);
    let z = mergeBuffers(metadataBuffer.buffer, t);
    ws.send(z);
}

/* Feature will be added in future release 

function toggleWebCont() {
    let a = document.querySelector('.ird');
    const currentVisibility = getComputedStyle(a).visibility;
    const currentOpacity = getComputedStyle(a).opacity;
    if (currentVisibility === 'visible' && currentOpacity === '1') {
        a.style.opacity = '0';
        a.style.visibility = 'hidden';
    } else {
        a.style.opacity = '1';
        a.style.visibility = 'visible';
    }
}

function swapTo(id) {
    for(let i=1;i<3;i++) {
        document.querySelector('.w' + i).style.display = 'none';
    }
    document.querySelector('.w' + id).style.display = 'flex';
}

*/