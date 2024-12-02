var fileName = '';
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
    connClose: `Connection closed unexpectedly. Check your connection and reload the Page...`,
}



document.addEventListener("DOMContentLoaded", function() {
  
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
        file = event.target.files[0];
        if(!file) return;
        fileName = file.name;
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

async function send() {
    let chunkSize = 1024 * 50;
    let fileID = Math.floor((10**5) + Math.random() * (9 * (10**5)));
   let id = document.getElementById('in_id').value;
   let isLargeFile = file.size > 1024 * 1024 * 300;
   console.log(isLargeFile);
        splitFile(
            file,                      
            chunkSize,                     
            (chunk, sequencenumber) => {
                const message = {
                    type: 'file',
                    targetClientId: id,
                    fileName: fileName,
                    fileSize: file.size,
                    fileID: fileID,
                    sequencenumber: sequencenumber,
                    isLargeFile: isLargeFile,
                };
                const msgJSON = JSON.stringify(message);
                const metadataBuffer = new TextEncoder().encode(msgJSON + "\0");
                let x = mergeBuffers(metadataBuffer.buffer, chunk);
                ws.send(x);
        });
}

function idSelector() {
    document.getElementById('id_div').style.display = 'grid';
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
        a.querySelector('.dBtn').onclick = async function() {
            this.src = 'resources/imgs/spinner1.svg'
            await setTimeout(10000);
            await deleteEntry(id); 
            createFile(id, servedfileName);
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

    // wss://don-m0rx.onrender.com//
    let ws = new WebSocket('ws://localhost:2104/');
    
    ws.onopen = () => { 
        document.querySelector('.load_overlay').style.display = 'none';
   };

    ws.onerror = () => { 
        document.querySelector('.load_overlay').innerText = "Couldn't Connect to server. Check your connection";
        document.querySelector('.load_overlay').style.display = 'flex';
   };

   ws.onclose = (event) => {
        document.querySelector('.load_overlay').innerHTML = error.connClose;
        document.querySelector('.load_overlay').style.display = 'flex';
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
                        let t = document.getElementById(`${r.fileID}`).parentElement.parentElement
                        t.querySelector('#speedTxt').innerText = speedTimer(r.fileID, false, r.sequencenumber);
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
            if(msg.type === 'id') {   document.getElementById('id').innerText = msg.message; }
            else if(msg.type === 'client_list') {
                
            } else if(msg.type === 'Error') {
                alert('App Crashed');
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
    return `${((a*1024*50)/t_1[i-1]).toFixed(0)}${t_2[i-1]}/${((b)/t_1[i-1]).toFixed(0)}${t_2[i-1]}`;
}