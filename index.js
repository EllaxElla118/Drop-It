var imgPath = '';
const extImgs = {
    pdf: 'resources/imgs/pdf.png',
    jpg: 'resources/imgs/jpg.png',
    cdr: 'resources/imgs/cdr.png',
    doc: 'resources/imgs/doc.png',
    docx: 'resources/imgs/doc.png',
    psd: 'resources/imgs/psd.png',
};
let template;
const error =  {
    connClose: `Connection closed unexpectedly. Check your connection and reload the Page...`
};



document.addEventListener("DOMContentLoaded", function() {
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

  document.querySelector('.create').addEventListener('click', function() {
    const bodyArea = document.querySelector('.body_area');
    if (bodyArea.style.display === 'none' || bodyArea.style.display === '') {
      bodyArea.style.display = 'flex';
    } else {
      bodyArea.style.display = 'none';
    }
  });

});

window.addEventListener("DOMContentLoaded", (event) => {
    template = document.querySelector('.icFile');
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
        document.querySelector('#id_div').style.display = 'none';
        document.querySelector('.qrScanner').style.display = 'none';
        document.querySelector('#overlay').style.display = 'none';
}

async function send(r) {
    document.querySelector('#sBtn').innerHTML = "<img style='width: 18%' src='resources/imgs/spinner1.svg' />";
    document.querySelector('#sBtn').disabled = 'true';
    document.querySelector('#sBtn').style.backgroundColor = 'white';
    document.querySelector('#sBtn').style.border = '2px solid green';
    setTimeout(function() {
        document.querySelector('#id_div').style.display = 'none';
        document.querySelector('#overlay').style.display = 'none';
        document.querySelector('#sBtn').innerHTML = "Send";
        document.querySelector('#sBtn').disabled = 'false';
        document.querySelector('#sBtn').style.backgroundColor = '#4CAF50';
        document.querySelector('#sBtn').style.border = '2px solid white';
    }, 1500);
    let chunkSize = 1024 * 50;
   let id = document.getElementById('in_id').value;
   const fileInput = document.querySelector('#file');
   const files = r || fileInput.files;

    for (let x = 0; x < files.length; x++) {
        const file = files[x]; // Access the actual File object
        let fileID = Math.floor((10**5) + Math.random() * (9 * (10**5)));
        let isLargeFile = file.size > 1024 * 1024 * 300;
        splitFile(
            file,                      
            chunkSize,                     
            (chunk, sequencenumber) => {
                const message = {
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
                ws.send(z);
                th = Math.floor((sequencenumber * 100) * (Math.ceil(file.size / (1024 * 50))**-1));
                document.querySelector('.sNote').innerHTML = files.length > 1 ? (`Sending ${files.length} files`) : (th === 100 ? '' : `${th}%`);
        });
                
                                                                                /* true
            /*
                if(files.length === 1) {
                    document.querySelector('.sNote').innerHTML = th === 100 ? '<i>Sent...</i>' : th + '%';
                } else {
                    document.querySelector('.sNote').innerHTML = `Sending ${files.length} files`;
                }
*/
    };
}

function idSelector() {
    document.getElementById('id_div').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}

function incomingFile(servedfileName, id, w) {
    let ext = servedfileName.split(".").slice(1).pop() || "";
    imgPath = extImgs[ext] || 'resources/imgs/unknown.png';
    let a = template.cloneNode(true);
    a.style.display = 'flex';
    a.querySelector('.progressInner').setAttribute('id', id);
    a.querySelector('#imgFileType').src = imgPath;
    if(!w) {
        a.querySelector('.dBtn').onclick = function() {
            this.children[0].src = 'resources/imgs/spinner1.svg';
            setTimeout(async function() {
                await createFile(id, servedfileName);
                deleteEntry(id); 
            }, 1000);
        }
    } else{
        a.querySelector('.dBtn').onclick = async function() {
            await deleteEntry(id);
            createFileUsingWorker(id, servedfileName);
        }
    }
    a.querySelector('#deleteBtn').onclick = async function() {
            delete chunkMemory[id];
            await deleteEntry(id);
    }
    if(servedfileName.replace('.' + ext).length > 20) { a.querySelector('#FileName').textContent = servedfileName.slice(0,15) + '∙∙∙.' + ext;   }
    else {  a.querySelector('#FileName').textContent = servedfileName;   };
    document.querySelector('.body_area').appendChild(a);  
    if (document.querySelector('.body_area').style.display !== 'flex') {
        document.querySelector('.create').click();
    }
}

memory = [];

    // ws://127.0.0.1:2104 //
    let ws = new WebSocket('wss://don-m0rx.onrender.com/');

    ws.onopen = () => { 
        if(document.readyState === 'loading') {
            location.reload();
            return;
        }
        document.querySelector('.load_overlay').style.display = 'none';     
   };

    ws.onerror = () => { 
        document.querySelector('.load_overlay').innerText = "Couldn't Connect to server. Check your connection";
        document.querySelector('.load_overlay').style.display = 'flex';
   };

   ws.onclose = (event) => {
       throwError('wild', error.connClose);
    };

    let memory_block_2 = [];

    ws.onmessage = (message) => {
        if(message.data instanceof Blob) { 
                reconstructFile(message.data, (r) => {
                    let cCalc = Math.floor((r.sequencenumber * 100) * (Math.ceil(r.fileSize / (1024 * 50))**-1));
                    function fileId(fileId) { return fileId === r.fileID  }
                    if(!memory_block_2.find(fileId)) {
                        incomingFile(r.fileName, r.fileID, r.isLargeFile);
                        memory_block_2.push(r.fileID);
                        speedTimer(r.fileID, true);
                    } else {  
                        document.getElementById(`${r.fileID}`).style.flex = cCalc/100;
                        let t = document.getElementById(`${r.fileID}`).parentElement.parentElement;
                        let f = speedTimer(r.fileID, false, r.sequencenumber);
                        t.querySelector('#speedTxt').innerText = f != 'NaN kb/s' ? f : '-- b/s';
                        t.querySelector('#fileProgress').innerText = progessCalc(r.sequencenumber, r.fileSize);
                    }
                    if(cCalc === 100) {
                        let p = document.getElementById(`${r.fileID}`).parentElement.parentElement.querySelector('#h_001_d').style.display = 'contents';
                        let x = document.getElementById(`${r.fileID}`).parentElement;
                        x.style.display = 'none';
                        x.parentElement.querySelector('#h_002_e').style.display = 'none';
                    };                       
                });
        } else {  
            let msg = JSON.parse(message.data);
            if(msg.type === 'id') {   
                document.getElementById('id').innerText = msg.message;                       
                appendQR(msg.message);
             }
            else if(msg.type === 'client_list') {

            } else if(msg.type === 'Error') {
                throwError('mild', msg.message);
            } else if(msg.type === 'QRAccept') {
                acceptedQR(msg.message);
            }     
    };
};

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

var timeKeeper = [];

function speedTimer(a, b, c) {
    const t_1 = [1024, 1024 * 1024, 1024 * 1024 * 1024]; // Thresholds for kb, mb, gb
    const t_2 = ['kb/s', 'mb/s', 'gb/s']; // Units for thresholds

    if (b) {
        // Start timing
        timeKeeper[a] = Date.now();
        return "0 kb/s";
    } else {
        if (!timeKeeper[a]) {
            return "Error.";
        }

        // Calculate elapsed time in seconds
        const elapsedTime = (Date.now() - timeKeeper[a]) / 1000;

        // Calculate speed
        const speed = (c * 50) / elapsedTime;

        // Determine appropriate unit
        let i = 0;
        while (speed > t_1[i] && i < t_1.length - 1) {
            i++;
        }
        return (speed/t_1[i-1]).toFixed(2) + ' ' + t_2[i];
    }
}

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

function throwError(level = 'mild', error = 'An unknown Error occurred') {
    if(level === 'wild') {
        document.querySelector('.load_overlay').innerHTML = error;
        document.querySelector('.load_overlay').style.display = 'flex';
    } else {
        alert(error);
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
    document.querySelector('#sBtn').click()
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