import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { Dropzone } from 'dropzone';

let terminalInstance = null;
let dropzoneInstance = null;

export async function initTerminal(id, nsId, mciId, vmid) {
    let fileContents = [];

    if (terminalInstance) {
        terminalInstance.dispose();
        terminalInstance = null;
    }

    if (dropzoneInstance) {
        dropzoneInstance.destroy();
        dropzoneInstance = null;
    }

    const term = new Terminal({
        theme: {
            background: '#1e1e1e',
            foreground: '#ffffff',
            cursor: '#ffcc00'
        },
        cursorBlink: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    const container = document.getElementById(id);
    term.open(container);
    terminalInstance = term;

    function prompt() {
        term.write('\r\n\r\n $ ');
    }

    const ipcmd = "client_ip=$(echo $SSH_CLIENT | awk '{print $1}'); echo SSH Private IP is: $client_ip";
    await processCommand(nsId, mciId, vmid, [ipcmd], term, () => {
        prompt();
    });

    let userInput = '';
    term.onData(async (data) => {
        if (data === '\r') {
            const command = userInput;
            userInput = '';
            term.write(`\r\n`);
            await processCommand(nsId, mciId, vmid, [command], term, () => {
                prompt();
            });
        } else if (data === '\u007f') {
            if (userInput.length > 0) {
                term.write('\b \b');
                userInput = userInput.slice(0, -1);
            }
        } else {
            if (/^[a-zA-Z0-9 !@#$%^&*()_\-+=\[\]{}|;:'",.<>/?]$/.test(data)) {
                term.write(data);
                userInput += data;
            }
        }
    });

    dropzoneInstance = new Dropzone("#dropzone-custom", {
        autoProcessQueue: false,
        addRemoveLinks: true,
        acceptedFiles: ".sh",
        init: function () {
            this.on("addedfile", function (file) {
                if (file.name.endsWith(".sh")) {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        const fileText = event.target.result;
                        const modifiedContent = fileText
                            .split('\n')
                            .map(line => line.trim())
                            .filter(line => line.length > 0);
                        fileContents.push(modifiedContent);
                    };
                    reader.onerror = function () {
                        alert("Failed to read file");
                    };
                    reader.readAsText(file);
                } else {
                    alert("Only shell script files (.sh) are allowed.");
                }
            });
        }
    });

    document.getElementById("show-content-btn").addEventListener("click", async function () {
        if (fileContents.length > 0) {
            for (const cmdarr of fileContents) {
                try {
                    await processCommand(nsId, mciId, vmid, cmdarr, terminalInstance, () => {
                        prompt();
                    });
                } catch (error) {
                    alert("An error occurred while processing the command.");
                    console.error(error);
                }
            }
        } else {
            alert("No file content available or file not loaded.");
        }
    });
}

async function processCommand(nsid, mciid, vmid, command, term, callback) {
    const loadingSymbols = ['|', '/', '-', '\\'];
    let loadingIndex = 0;

    const loadingInterval = setInterval(() => {
        term.write(`\r     ${loadingSymbols[loadingIndex]} Processing...`);
        loadingIndex = (loadingIndex + 1) % loadingSymbols.length;
    }, 250);

    try {
        const result = await postcmdmci(nsid, mciid, vmid, command);
        clearInterval(loadingInterval);
        term.write('\r                          \r');

        const response = result.results[0];
        const callErr = response.err;
        const stdout = response.stdout;
        const stderr = response.stderr;

        if (callErr) {
            const formattedError = JSON.stringify(callErr, null, 2);
            writeAutoWrap(term, " > connect Error: \x1b[1m\x1b[31m" + formattedError + "\x1b[0m");
            callback({ error: callErr });
            return;
        }

        if (stderr && Object.values(stderr).some(value => value.trim() !== '')) {
            term.write('\r\n\x1b[1m\x1b[31mSTDERR RESPONSE:\r\n');
            Object.values(stderr).forEach(value => {
                writeAutoWrap(term, value);
            });
            term.write("\x1b[0m\r\n");
        }

        if (stdout && Object.values(stdout).some(value => value.trim() !== '')) {
            Object.values(stdout).forEach(value => {
                writeAutoWrap(term, value);
            });
        } else {
            term.write('\r\nSTDOUT RESPONSE: (No output)\r\n');
        }

        callback(result);
    } catch (error) {
        clearInterval(loadingInterval);
        term.write('\r                          \r');
        term.write(`Error: ${error.message}\r\n`);
        callback(result);
    }
}

function writeAutoWrap(term, text) {
    const cols = term.cols;
    let currentLine = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '\n') {
            term.write(currentLine + '\r\n');
            currentLine = '';
            continue;
        }
        currentLine += char;
        if (currentLine.length >= cols) {
            term.write(currentLine + '\r\n');
            currentLine = '';
        }
    }

    if (currentLine) {
        term.write(currentLine);
    }
}

export async function postcmdmci(nsid, mciid, vmid, cmdarr) {
    const data = {
        pathParams: {
            nsId: nsid,
            mciId: mciid
        },
        queryParams: {
            vmId: vmid
        },
        Request: {
            command: cmdarr,
            userName: "cb-user"
        }
    };
    const controller = "/api/" + "mc-infra-manager/" + "Postcmdmci";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    const responseData = response.data.responseData;
    return responseData;
}