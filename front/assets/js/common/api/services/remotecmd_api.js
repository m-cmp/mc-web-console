import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

let terminalInstance = null;

export async function initTerminal(id, nsId, mciId, vmid) {
	console.log("Trying to connect to " + nsId + " / " + mciId);
	
	// 기존 터미널이 존재한다면 삭제
	if (terminalInstance) {
		terminalInstance.dispose();
		terminalInstance = null;
	}

	// 새 터미널 및 FitAddon 생성
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

	// 터미널을 지정된 컨테이너에 열기
	const container = document.getElementById(id);
	term.open(container);
	
	terminalInstance = term;

	const ipcmd = "client_ip=$(echo $SSH_CLIENT | awk '{print $1}'); echo SSH client IP is: $client_ip";
	await processCommand(nsId, mciId, vmid, ipcmd, term, () => {
		// console.log("done get ip")
	});

	function prompt() {
		term.write('\r\n $ ');
	}
	prompt();

	let userInput = '';

	term.onData(async (data) => {
		if (data === '\r') { 
			const command = userInput; 
			userInput = ''; 
			term.write(`\r\n`); 
			
			await processCommand(nsId, mciId, vmid, command, term, () => {
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
}

async function processCommand(nsid, mciid, vmid, command, term, callback) {
	const loadingSymbols = ['|', '/', '-', '\\'];
	let loadingIndex = 0;

	const loadingInterval = setInterval(() => {
		term.write(`\r${loadingSymbols[loadingIndex]} Processing...`);
		loadingIndex = (loadingIndex + 1) % loadingSymbols.length;
	}, 250);

	try {
		// API 호출 및 결과 받기
		const result = await postcmdmci(nsid, mciid, vmid, [command]);
		
		clearInterval(loadingInterval); // 로딩 애니메이션 중지
		term.write('\r                     \r'); // 로딩 텍스트 지우기

		const response = result.results[0];
		const stdout = response.stdout;
		const stderr = response.stderr;

		// STDOUT 출력
		if (stdout && Object.values(stdout).some(value => value.trim() !== '')) {
			term.write('\r\nSTDOUT:\r\n');
			Object.values(stdout).forEach(value => {
				const lines = value.split('\n');
				lines.forEach(line => {
					writeAutoWrap(term, line);
				});
			});
		} else {
			term.write('\r\nSTDOUT: (No output)\r\n');
		}

		// STDERR 출력
		if (stderr && Object.values(stderr).some(value => value.trim() !== '')) {
			term.write('\r\nSTDERR:\r\n');
			Object.values(stderr).forEach(value => {
				const lines = value.split('\n');
				lines.forEach(line => {
					if (line.trim() !== "") { 
						writeAutoWrap(term, line);
					}
				});
			});
		}

		callback(); // 완료 콜백 호출

	} catch (error) {
		clearInterval(loadingInterval); // 에러 발생 시 로딩 애니메이션 중지
		term.write('\r                     \r'); // 로딩 텍스트 지우기
		term.write(`Error: ${error.message}\r\n`); // 에러 메시지 전달
		callback();
	}
}

// 자동 줄바꿈 처리 함수
function writeAutoWrap(term, text) {
	const cols = term.cols;
	console.log("@@@@@@@@@@ cols", cols)
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
	}
	const controller = "/api/" + "mc-infra-manager/" + "Postcmdmci";
	const response = await webconsolejs["common/api/http"].commonAPIPost(
		controller,
		data
	);
	console.log("lookup disk info response : ", response);
	const responseData = response.data.responseData;
	return responseData;
}
