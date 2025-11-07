// Remote Command UI and Business Logic
// 터미널, 모달, 파일 전송 등 UI 관련 기능들

import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { Dropzone } from 'dropzone';
import { showCommandProgressToast, hideProgressToast, showProgressToast, showRetryProgressToast, showRetrySuccessToast, showRetryErrorToast } from '../../../common/utils/toast.js';
import { postRemoteCmd, postFileToMci } from '../../../common/api/services/remotecmd_api.js';

let terminalInstance = null;
let dropzoneInstance = null;

// 터미널 관련 함수들
export async function initTerminal(id, nsId, mciId, targetId, targetType) {
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
    await processCommand(nsId, mciId, targetId, [ipcmd], term, () => {
        prompt();
    }, targetType);

    let userInput = '';
    term.onData(async (data) => {
        if (data === '\r') {
            const command = userInput;
            userInput = '';
            term.write(`\r\n`);
            await processCommand(nsId, mciId, targetId, [command], term, () => {
                prompt();
            }, targetType);
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

    // targetType에 따라 다른 ID 사용
    let dropzoneId, buttonId, pathInputId;

    if (targetType === 'mci') {
        dropzoneId = '#mci-dropzone-custom';
        buttonId = 'mci-show-content-btn';
        pathInputId = 'mci-file-path-input';
    } else if (targetType === 'subgroup') {
        dropzoneId = '#subgroup-dropzone-custom';
        buttonId = 'subgroup-show-content-btn';
        pathInputId = 'subgroup-file-path-input';
    } else {
        // vm 타입
        dropzoneId = '#dropzone-custom';
        buttonId = 'show-content-btn';
        pathInputId = 'file-path-input';
    }

    // VM과 동일한 방식: 간단한 Dropzone 초기화
    setTimeout(() => {
        const dropzoneElement = document.querySelector(dropzoneId);

        if (dropzoneElement && !dropzoneElement.dropzone) {
            dropzoneInstance = new Dropzone(dropzoneId, {
                autoProcessQueue: false,
                addRemoveLinks: true,
                acceptedFiles: ".txt,.json,.yaml,.yml,.conf,.log,.sh",
                maxFilesize: 10, // 10MB
                clickable: true, // 클릭 가능하도록 명시적 설정
                init: function () {
                    this.on("addedfile", function (file) {
                        if (file instanceof File) {
                            // 중복 파일 체크
                            const isDuplicate = fileContents.some(existingFile =>
                                existingFile.name === file.name && existingFile.size === file.size
                            );

                            if (!isDuplicate) {
                                fileContents.push(file);
                            }
                        }
                    });

                    // 강제로 클릭 이벤트 추가
                    const dropzoneElement = this.element;

                    // 더 강력한 클릭 이벤트 추가
                    dropzoneElement.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        // 파일 입력 요소 생성
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.multiple = true;
                        fileInput.accept = '.txt,.json,.yaml,.yml,.conf,.log,.sh';
                        fileInput.style.display = 'none';

                        fileInput.addEventListener('change', function (e) {
                            const files = Array.from(e.target.files);

                            files.forEach(file => {
                                if (file instanceof File) {
                                    // 중복 파일 체크
                                    const isDuplicate = fileContents.some(existingFile =>
                                        existingFile.name === file.name && existingFile.size === file.size
                                    );

                                    if (!isDuplicate) {
                                        fileContents.push(file);

                                        // Dropzone에 파일 추가
                                        dropzoneInstance.addFile(file);
                                    }
                                }
                            });
                        });

                        document.body.appendChild(fileInput);
                        fileInput.click();
                        document.body.removeChild(fileInput);
                    }, true); // capture phase에서 실행

                    // 추가적인 클릭 이벤트 (dz-message 영역)
                    const dzMessage = dropzoneElement.querySelector('.dz-message');
                    if (dzMessage) {
                        dzMessage.addEventListener('click', function (e) {
                            e.preventDefault();
                            e.stopPropagation();

                            // 파일 입력 요소 생성
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.multiple = true;
                            fileInput.accept = '.txt,.json,.yaml,.yml,.conf,.log,.sh';
                            fileInput.style.display = 'none';

                            fileInput.addEventListener('change', function (e) {
                                const files = Array.from(e.target.files);

                                files.forEach(file => {
                                    if (file instanceof File) {
                                        // 중복 파일 체크
                                        const isDuplicate = fileContents.some(existingFile =>
                                            existingFile.name === file.name && existingFile.size === file.size
                                        );

                                        if (!isDuplicate) {
                                            fileContents.push(file);

                                            // Dropzone에 파일 추가
                                            dropzoneInstance.addFile(file);
                                        }
                                    }
                                });
                            });

                            document.body.appendChild(fileInput);
                            fileInput.click();
                            document.body.removeChild(fileInput);
                        }, true);
                    }
                }
            });
        } else if (dropzoneElement && dropzoneElement.dropzone) {
            // Dropzone already initialized
        }
    }, 100);

    document.getElementById(buttonId).addEventListener("click", async function () {
        if (fileContents.length > 0) {
            const targetPath = document.getElementById(pathInputId).value;

            // 모든 파일을 한 번에 처리
            try {
                await transferFilesToMci(fileContents, targetPath, nsId, mciId, targetType, targetId);

                // 전송 완료 후 파일 목록 초기화
                fileContents = [];
                if (dropzoneInstance) {
                    dropzoneInstance.removeAllFiles(true);
                }
            } catch (error) {
                alert("File transfer failed: " + error.message);
                console.error(error);
            }
        } else {
            alert("No file available or file not loaded.");
        }
    });
}

// K8s Cluster 전용 터미널 초기화 함수
export async function initClusterTerminal(id, nsId, clusterId, namespace, podName, containerName = null) {
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

    // SSH Private IP 메시지 제거 - 기존 로직은 유지하되 화면에 표시하지 않음
    const ipcmd = "client_ip=$(echo $SSH_CLIENT | awk '{print $1}'); echo SSH Private IP is: $client_ip";

    await processCommand(nsId, clusterId, { namespace, podName, containerName }, [ipcmd], term, () => {
        prompt();
    }, 'cluster');

    // 터미널 초기화 후 바로 프롬프트 표시
    // prompt();

    let userInput = '';
    term.onData(async (data) => {
        if (data === '\r') {
            const command = userInput;
            userInput = '';
            term.write(`\r\n`);
            await processCommand(nsId, clusterId, { namespace, podName, containerName }, [command], term, () => {
                prompt();
            }, 'cluster');
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
                    await processCommand(nsId, clusterId, { namespace, podName, containerName }, cmdarr, terminalInstance, () => {
                        prompt();
                    }, 'cluster');
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

// MCI/SubGroup용 단발성 명령어 실행 초기화 함수
export async function initBatchCommandTerminal(id, nsId, mciId, targetId, targetType) {
    // 기존 터미널 인스턴스 정리
    if (terminalInstance) {
        terminalInstance.dispose();
        terminalInstance = null;
    }

    if (dropzoneInstance) {
        dropzoneInstance.destroy();
        dropzoneInstance = null;
    }

    // targetType에 따라 다른 ID 사용
    let commandInputId, executeButtonId, executeAgainButtonId, inputSectionId, resultsSectionId;

    if (targetType === 'mci') {
        commandInputId = 'mci-command-input';
        executeButtonId = 'mci-execute-command-btn';
        executeAgainButtonId = 'mci-execute-again-btn';
        inputSectionId = 'mci-command-input-section';
        resultsSectionId = 'mci-command-results-section';
    } else if (targetType === 'subgroup') {
        commandInputId = 'subgroup-command-input';
        executeButtonId = 'subgroup-execute-command-btn';
        executeAgainButtonId = 'subgroup-execute-again-btn';
        inputSectionId = 'subgroup-command-input-section';
        resultsSectionId = 'subgroup-command-results-section';
    } else {
        console.error('initBatchCommandTerminal: Invalid targetType:', targetType);
        return;
    }

    // 명령어 실행 버튼 이벤트 리스너 설정
    const executeButton = document.getElementById(executeButtonId);
    if (executeButton) {
        // 기존 이벤트 리스너 제거
        executeButton.replaceWith(executeButton.cloneNode(true));
        const newExecuteButton = document.getElementById(executeButtonId);

        newExecuteButton.addEventListener("click", async function () {
            const command = document.getElementById(commandInputId).value.trim();
            if (!command) {
                alert("Please enter a command to execute.");
                return;
            }

            // 입력 섹션 숨기고 결과 섹션 표시
            document.getElementById(inputSectionId).style.display = 'none';
            document.getElementById(resultsSectionId).style.display = 'block';

            // 명령어 실행
            await executeBatchCommand(command, nsId, mciId, targetId, targetType);
        });
    }

    // Execute Again 버튼은 이제 결과 모달에서 처리됨

    // 파일 전송 기능 초기화 (기존 로직 유지)
    initFileTransfer(targetType, nsId, mciId, targetId);
}

// 명령어 실행 및 UI 처리
export async function executeBatchCommand(command, nsId, mciId, targetId, targetType) {
    try {
        // 1. 진행 상태 표시
        showCommandProgressToast(command, 'executing');

        // 2. 여러 줄 명령어를 배열로 분리 (줄바꿈과 세미콜론 모두 지원)
        const commands = command
            .split(/[\n;]/)  // 줄바꿈과 세미콜론으로 분리
            .map(cmd => cmd.trim())  // 공백 제거
            .filter(cmd => cmd !== '');  // 빈 문자열 제거

        // 3. 명령어 실행
        const result = await postRemoteCmd(nsId, mciId, targetId, commands, targetType);

        // 4. 진행 상태 토스트 숨기기
        hideProgressToast();

        // 5. 결과 표시
        showCommandResults(command, result, targetType);

    } catch (error) {
        // 6. 진행 상태 토스트 숨기기
        hideProgressToast();

        // 7. 에러 표시
        showCommandError(command, error);
    }
}

// 단건 VM 명령어 실행 함수 (retry용)
export async function executeSingleVMCommand(command, nsId, mciId, vmId) {
    try {
        // 1. 여러 줄 명령어를 배열로 분리
        const commands = command
            .split(/[\n;]/)
            .map(cmd => cmd.trim())
            .filter(cmd => cmd !== '');

        // 2. 단건 VM 명령어 실행
        const result = await postRemoteCmd(nsId, mciId, vmId, commands, 'vm');

        // 3. 결과 반환 (배치 실행과 동일한 구조로 변환)
        return {
            responseData: {
                results: result.results || [result]
            }
        };

    } catch (error) {
        console.error('Single VM command execution failed:', error);
        throw error;
    }
}

// VM 명령어 retry 함수
export async function retryVMCommand(vmId, resultIndex) {
    try {
        // 1. 현재 명령어와 컨텍스트 정보 가져오기
        const command = window.currentCommand;
        const nsId = window.currentNsId;
        const mciId = window.currentMciId;

        if (!command || !nsId || !mciId) {
            alert('Command context not found. Please try again.');
            return;
        }

        // 2. retry 진행 상태 표시
        showRetryProgressToast(vmId);

        // 3. 단건 VM 명령어 실행
        const result = await executeSingleVMCommand(command, nsId, mciId, vmId);

        // 4. 진행 상태 토스트 숨기기
        hideProgressToast();

        // 5. 결과 업데이트
        if (result && result.responseData && result.responseData.results && result.responseData.results.length > 0) {
            const newResult = result.responseData.results[0];

            // 6. 기존 결과 데이터 업데이트
            if (window.commandResultData && window.commandResultData[resultIndex]) {
                window.commandResultData[resultIndex] = newResult;

                // 7. 현재 페이지 다시 렌더링
                showCommandResultPage(window.currentCommandResultPage);

                // 8. 성공/실패 토스트 표시
                const isSuccess = !newResult.error || newResult.error === '';
                if (isSuccess) {
                    showRetrySuccessToast(vmId);
                } else {
                    showRetryErrorToast(vmId, newResult.error);
                }
            }
        } else {
            throw new Error('Invalid response format');
        }

    } catch (error) {
        // 9. 진행 상태 토스트 숨기기
        hideProgressToast();

        // 10. 에러 토스트 표시
        showRetryErrorToast(vmId, error.message);
        console.error('Retry failed:', error);
    }
}

// 파일 전송 및 UI 처리
export async function transferFilesToMci(files, targetPath, nsId, mciId, targetType, targetId) {
    // VM 타입인 경우 기존 방식 사용 (파일별로 개별 처리)
    if (targetType === 'vm') {
        const results = [];

        for (const file of files) {
            try {
                // 1. 로딩 상태 표시
                showTransferProgress(file.name, 'uploading');

                // 2. PostFileToMci API 호출
                const result = await postFileToMci(nsId, mciId, file, targetPath, targetType, targetId);

                // 3. 진행 상태 토스트 숨기기
                hideProgressToast();

                // 4. 결과 저장 (모달 표시하지 않음)
                results.push({ fileName: file.name, result: result });

            } catch (error) {
                // 5. 진행 상태 토스트 숨기기
                hideProgressToast();

                // 6. 에러 저장
                results.push({ fileName: file.name, error: error });
            }
        }

        // 7. VM 타입용 결과 표시 (한 번만)
        showTransferResultsForVM(results);
        return;
    }

    // SubGroup이나 MCI 타입인 경우 새로운 방식 사용
    const results = [];

    for (const file of files) {
        try {
            // 1. 로딩 상태 표시
            showTransferProgress(file.name, 'uploading');

            // 2. PostFileToMci API 호출
            const result = await postFileToMci(nsId, mciId, file, targetPath, targetType, targetId);

            // 3. 진행 상태 토스트 숨기기
            hideProgressToast();

            // 4. 결과 저장
            results.push({ fileName: file.name, result: result });

        } catch (error) {
            // 5. 진행 상태 토스트 숨기기
            hideProgressToast();

            // 6. 에러 저장
            results.push({ fileName: file.name, error: error });
        }
    }

    // 7. 전체 결과 표시 (한 번만)
    showTransferResults(results);
}

// 파일 전송 함수 (단일 파일용)
export async function transferFileToMci(file, targetPath, nsId, mciId, targetType, targetId) {
    // 1. 로딩 상태 표시
    showTransferProgress(file.name, 'uploading');

    try {
        // 2. PostFileToMci API 호출
        const result = await postFileToMci(nsId, mciId, file, targetPath, targetType, targetId);

        // 3. 진행 상태 토스트 숨기기
        hideProgressToast();

        // 4. 결과 표시
        showTransferResult(file.name, result);

    } catch (error) {
        // 5. 진행 상태 토스트 숨기기
        hideProgressToast();

        // 6. 에러 표시
        showTransferError(file.name, error);
    }
}

// 데이터 변환/유틸리티 함수들
export function formatCommandResult(result) {
    // API 응답을 UI 표시용으로 변환
    if (!result || !result.results) {
        return { success: false, message: 'No results available' };
    }

    const successCount = result.results.filter(r => !r.error || r.error === '').length;
    const totalCount = result.results.length;

    return {
        success: successCount === totalCount,
        successCount,
        totalCount,
        results: result.results
    };
}

export function validateCommandInput(command) {
    if (!command || typeof command !== 'string') {
        return { valid: false, message: 'Command must be a non-empty string' };
    }

    const trimmedCommand = command.trim();
    if (trimmedCommand === '') {
        return { valid: false, message: 'Command cannot be empty' };
    }

    // 위험한 명령어 체크 (선택적)
    const dangerousCommands = ['rm -rf', 'sudo rm', 'format', 'fdisk'];
    const isDangerous = dangerousCommands.some(cmd => trimmedCommand.toLowerCase().includes(cmd));
    
    if (isDangerous) {
        return { valid: false, message: 'Potentially dangerous command detected' };
    }

    return { valid: true };
}

export function buildCommandData(nsid, resourceId, targetId, cmdarr, targetType) {
    let data;

    if (targetType === 'vm') {
        data = {
            pathParams: {
                nsId: nsid,
                mciId: resourceId
            },
            queryParams: {
                vmId: targetId
            },
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    } else if (targetType === 'subgroup') {
        data = {
            pathParams: {
                nsId: nsid,
                mciId: resourceId
            },
            queryParams: {
                subGroupId: targetId
            },
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    } else if (targetType === 'mci') {
        data = {
            pathParams: {
                nsId: nsid,
                mciId: resourceId
            },
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    } else if (targetType === 'cluster') {
        const queryParams = {
            k8sClusterNamespace: targetId.namespace,
            k8sClusterPodName: targetId.podName
        };

        if (targetId.containerName) {
            queryParams.k8sClusterContainerName = targetId.containerName;
        }

        data = {
            pathParams: {
                nsId: nsid,
                k8sClusterId: resourceId
            },
            queryParams: queryParams,
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    }

    return data;
}

export function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function buildFileTransferData(nsId, mciId, file, targetPath, targetType, targetId) {
    let data = {
        pathParams: {
            nsId: nsId,
            mciId: mciId
        },
        request: {
            path: targetPath,
            file: {
                name: file.name,
                size: file.size,
                type: file.type,
                data: null // base64 데이터는 별도로 설정
            }
        }
    };

    // targetType에 따른 query parameter 추가
    if (targetType === 'subgroup' && targetId) {
        data.queryParams = { subGroupId: targetId };
    } else if (targetType === 'vm' && targetId) {
        data.queryParams = { vmId: targetId };
    }

    return data;
}

// UI 표시 함수들
export function showTransferProgress(fileName, status) {
    // 진행 상태 토스트 표시
    showProgressToast(fileName, status);
}

export function showTransferResultModal(fileName, result, successCount, totalCount) {
    // 기존 모달들 모두 제거
    const existingModal = document.getElementById('transferResultModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 기존 모달 인스턴스도 제거
    const existingModalInstance = bootstrap.Modal.getInstance(existingModal);
    if (existingModalInstance) {
        existingModalInstance.dispose();
    }

    // 모달 HTML 생성
    const modalHtml = `
        <div class="modal fade" id="transferResultModal" tabindex="-1" role="dialog" aria-labelledby="transferResultModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            File Transfer Result: ${fileName}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="card ${successCount === totalCount ? 'border-success' : 'border-warning'}">
                                    <div class="card-body text-center">
                                        <h6 class="card-title">Transfer Result</h6>
                                        <h4 class="${successCount === totalCount ? 'text-success' : 'text-warning'}">
                                            ${successCount}/${totalCount}
                                        </h4>
                                        <small class="text-muted">VM Transfer Complete</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card border-info">
                                    <div class="card-body text-center">
                                        <h6 class="card-title">Target Path</h6>
                                        <code>${(Array.isArray(result) && result.length > 0 && result[0]?.command?.['0']) ?
            result[0].command['0'].split(' to ')[1] || 'N/A' : 'N/A'}</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <h6>VM Transfer Details:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>VM ID</th>
                                        <th>VM IP</th>
                                        <th>Status</th>
                                        <th>Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(Array.isArray(result) ? result : []).map(r => {
                const isSuccess = !r.error || r.error === '';
                return `
                                        <tr class="${isSuccess ? 'table-success' : 'table-danger'}">
                                            <td><code>${r.vmId || 'N/A'}</code></td>
                                            <td><code>${r.vmIp || 'N/A'}</code></td>
                                            <td>
                                                ${isSuccess ?
                        '<span class="badge bg-success">Success</span>' :
                        '<span class="badge bg-danger">Failed</span>'
                    }
                                            </td>
                                            <td>
                                                ${isSuccess ?
                        `<small class="text-success">${r.stdout?.['0'] || 'Transfer Complete'}</small>` :
                        `<small class="text-danger">${r.error || 'Unknown Error'}</small>`
                    }
                                            </td>
                                        </tr>
                                        `;
            }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 새 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 모달 표시
    const modal = new bootstrap.Modal(document.getElementById('transferResultModal'));
    modal.show();

    // 전역 변수에 결과 저장 (복사 기능용)
    window.lastTransferResult = {
        fileName: fileName,
        result: result,
        successCount: successCount,
        totalCount: totalCount
    };
}

export function showCommandResultsInModal(command, result, successCount, totalCount, targetType) {
    // 기존 모달 제거
    const existingModal = document.getElementById('commandResultModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 컨텍스트 정보 저장 (retry용)
    window.currentCommand = command;
    window.currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject().NsId;
    window.currentMciId = window.currentMciId || window.currentSubGroupId; // MCI ID 저장

    // 모달 HTML 생성
    const modalHtml = `
        <div class="modal fade" id="commandResultModal" tabindex="-1" role="dialog" aria-labelledby="commandResultModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            Remote Terminal
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h5 class="mb-3">Execution Result/Output</h5>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="card ${successCount === totalCount ? 'border-success' : 'border-warning'}">
                                    <div class="card-body text-center">
                                        <h6 class="card-title">Execution Result Summary</h6>
                                        <h4 class="${successCount === totalCount ? 'text-success' : 'text-warning'}">
                                            ${successCount}/${totalCount}
                                        </h4>
                                        <small class="text-muted">Execution Complete</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card border-info" style="min-height: 8rem;">
                                    <div class="card-body text-center d-flex flex-column justify-content-center">
                                        <h6 class="card-title">Commands</h6>
                                        <textarea class="form-control text-info" readonly style="height: 3.5rem; font-family: monospace; font-size: 0.875rem; resize: none; text-align: left; overflow-y: auto;">${command}</textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                            <table class="table table-sm">
                                <thead class="table-light sticky-top">
                                    <tr>
                                        <th>VM ID</th>
                                        <th>VM IP</th>
                                        <th>Status</th>
                                        <th>Result</th>
                                    </tr>
                                </thead>
                                <tbody id="commandResultTableBody">
                                    <!-- Results will be populated by JavaScript -->
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Result Detail Area -->
                        <div class="mt-3">
                            <h6 class="mb-2">Result Detail</h6>
                            <div id="resultDetailArea" class="bg-dark text-light p-3 rounded" style="height: 120px; overflow-y: auto; font-family: monospace; font-size: 0.875rem; text-align: left;">
                                Click on a table row to view detailed result...
                            </div>
                        </div>
                        
                        <!-- Pagination -->
                        <nav aria-label="Command results pagination" id="commandResultPagination">
                            <ul class="pagination pagination-sm justify-content-center">
                                <!-- Pagination will be populated by JavaScript -->
                            </ul>
                        </nav>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary btn-sm rounded" onclick="executeCommandAgain()">
                          <span>Return<br>
                          <small>(Execute Commands)</small></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 모달을 body에 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 모달 표시
    const modalElement = document.getElementById('commandResultModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // 페이지네이션 초기화
    initCommandResultPagination(result);

    // 전역 변수에 결과 저장 (다시 실행 기능용)
    window.lastCommandResult = {
        command: command,
        result: result,
        successCount: successCount,
        totalCount: totalCount,
        targetType: targetType
    };
}

// 내부 함수들
async function processCommand(nsid, resourceId, targetId, command, term, callback, targetType) {
    const loadingSymbols = ['|', '/', '-', '\\'];
    let loadingIndex = 0;

    const loadingInterval = setInterval(() => {
        term.write(`\r     ${loadingSymbols[loadingIndex]} Processing...`);
        loadingIndex = (loadingIndex + 1) % loadingSymbols.length;
    }, 250);

    try {
        const result = await postRemoteCmd(nsid, resourceId, targetId, command, targetType);
        clearInterval(loadingInterval);
        term.write('\r                          \r');

        const response = result.results[0];
        const callErr = response.err;
        const stdout = response.stdout;
        const stderr = response.stderr;

        if (callErr && Object.keys(callErr).length > 0) {
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
        callback({ error: error.message });
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

function showTransferResultsForVM(results) {
    // VM 타입에서는 첫 번째 파일의 결과만 사용 (VM은 1개이므로)
    if (results.length > 0) {
        const firstResult = results[0];

        // API 응답 구조에 맞게 데이터 추출
        let resultArray = [];
        let fileName = 'Unknown File';

        // 다양한 가능한 구조 확인
        if (firstResult.responseData && firstResult.responseData.results) {
            resultArray = Array.isArray(firstResult.responseData.results) ? firstResult.responseData.results : [];
            fileName = firstResult.fileName || 'Unknown File';
        } else if (firstResult.result && firstResult.result.results) {
            resultArray = Array.isArray(firstResult.result.results) ? firstResult.result.results : [];
            fileName = firstResult.fileName || 'Unknown File';
        } else if (firstResult.result && Array.isArray(firstResult.result)) {
            resultArray = firstResult.result;
            fileName = firstResult.fileName || 'Unknown File';
        } else if (Array.isArray(firstResult)) {
            resultArray = firstResult;
            fileName = 'Unknown File';
        } else {
            // 직접 데이터가 있는지 확인
            if (firstResult.vmId || firstResult.vmIp) {
                resultArray = [firstResult];
                fileName = firstResult.fileName || 'Unknown File';
            }
        }

        const successCount = resultArray.filter(r => !r.error || r.error === '').length;
        const totalCount = resultArray.length;

        // VM 타입용 모달 표시
        showTransferResultModal(fileName, resultArray, successCount, totalCount);
    } else if (results.length > 0 && results[0].error) {
        // 에러가 있는 경우
        const firstResult = results[0];
        console.error(`Transfer failed: ${firstResult.fileName}`, firstResult.error);
    }
}

function showTransferResults(results) {
    const successFiles = results.filter(r => !r.error).length;
    const totalFiles = results.length;

    // 전체 결과 모달 표시
    showTransferResultsModal(results, successFiles, totalFiles);
}

function showTransferResult(fileName, result) {
    const successCount = result.filter(r => r.err === null).length;
    const totalCount = result.length;

    // 상세 결과를 모달로 표시
    showTransferResultModal(fileName, result, successCount, totalCount);
}

function showTransferResultsModal(results, successFiles, totalFiles) {
    // 기존 모달 제거
    const existingModal = document.getElementById('transferResultsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 모달 HTML 생성
    const modalHtml = `
        <div class="modal fade" id="transferResultsModal" tabindex="-1" role="dialog" aria-labelledby="transferResultsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            File Transfer Results Summary
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="card ${successFiles === totalFiles ? 'border-success' : 'border-warning'}">
                                    <div class="card-body text-center">
                                        <h6 class="card-title">Transfer Result</h6>
                                        <h4 class="${successFiles === totalFiles ? 'text-success' : 'text-warning'}">
                                            ${successFiles}/${totalFiles}
                                        </h4>
                                        <small class="text-muted">File Transfer Complete</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card border-info">
                                    <div class="card-body text-center">
                                        <h6 class="card-title">Transferred Files</h6>
                                        <h4 class="text-info">${totalFiles}</h4>
                                        <small class="text-muted">Files</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <h6>File Transfer Details:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>File Name</th>
                                        <th>Status</th>
                                        <th>VM Count</th>
                                        <th>Success/Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${results.map(r => {
        if (r.error) {
            return `
                                                <tr>
                                                    <td>${r.fileName}</td>
                                                    <td><span class="badge bg-danger">Failed</span></td>
                                                    <td>-</td>
                                                    <td>0/0</td>
                                                </tr>
                                            `;
        } else {
            let resultArray = [];

            // API 응답 구조에 맞게 데이터 추출
            if (r.result && r.result.results) {
                resultArray = Array.isArray(r.result.results) ? r.result.results : [];
            } else if (r.result && Array.isArray(r.result)) {
                resultArray = r.result;
            } else if (r.responseData && r.responseData.results) {
                resultArray = Array.isArray(r.responseData.results) ? r.responseData.results : [];
            }

            const successCount = resultArray.filter(vm => !vm.error || vm.error === '').length;
            const totalCount = resultArray.length;
            return `
                                                <tr>
                                                    <td>${r.fileName}</td>
                                                    <td><span class="badge ${successCount === totalCount ? 'bg-success' : 'bg-warning'}">${successCount === totalCount ? 'Success' : 'Partial Failure'}</span></td>
                                                    <td>${totalCount}</td>
                                                    <td>${successCount}/${totalCount}</td>
                                                </tr>
                                            `;
        }
    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 모달을 body에 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 모달 표시
    const modalElement = document.getElementById('transferResultsModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function showCommandResults(command, result, targetType) {
    // API 응답 구조에 맞게 results 배열 추출
    let resultArray = [];

    if (result && result.responseData && result.responseData.results) {
        // API 응답에서 results 배열 추출
        resultArray = result.responseData.results;
    } else if (Array.isArray(result)) {
        // 이미 배열인 경우 - 이중 배열인지 확인
        if (result.length > 0 && Array.isArray(result[0])) {
            // 이중 배열인 경우 첫 번째 배열 사용
            resultArray = result[0];
        } else {
            resultArray = result;
        }
    } else if (result && typeof result === 'object') {
        // 객체인 경우 배열로 변환
        resultArray = Object.values(result);
    } else {
        // 예상치 못한 형태인 경우 빈 배열로 처리
        console.error('Unexpected result format:', result);
        resultArray = [];
    }

    // 추가 검증: 여전히 이중 배열인지 확인하고 평탄화
    if (Array.isArray(resultArray) && resultArray.length > 0 && Array.isArray(resultArray[0])) {
        resultArray = resultArray[0];
    }

    // error 필드가 빈 문자열이면 성공으로 처리
    const successCount = resultArray.filter(r => r && (!r.error || r.error === '')).length;
    const totalCount = resultArray.length;

    // 결과를 화면에 표시
    showCommandResultsInModal(command, resultArray, successCount, totalCount, targetType);
}

function showCommandError(command, error) {
    alert(`Command execution failed: ${command} - ${error.message}`);
    console.error(`Command execution failed: ${command}`, error);
}

function initCommandResultPagination(results) {
    const itemsPerPage = 5;
    const totalPages = Math.ceil(results.length / itemsPerPage);

    // 현재 페이지를 전역 변수로 저장
    window.currentCommandResultPage = 1;
    window.commandResultData = results;
    window.commandResultItemsPerPage = itemsPerPage;

    // 첫 페이지 표시
    showCommandResultPage(1);

    // 페이지네이션 버튼 생성
    generateCommandResultPagination(totalPages);
}

function showCommandResultPage(page) {
    const results = window.commandResultData;
    const itemsPerPage = window.commandResultItemsPerPage;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageResults = results.slice(startIndex, endIndex);

    const tbody = document.getElementById('commandResultTableBody');
    if (!tbody) return;

    tbody.innerHTML = pageResults.map((r, index) => {
        const isSuccess = r && (!r.error || r.error === '');
        const globalIndex = (page - 1) * itemsPerPage + index;
        return `
        <tr class="${isSuccess ? 'table-success' : 'table-danger'}" style="cursor: pointer;" onclick="showResultDetail(${globalIndex})">
            <td>${r && r.vmId ? r.vmId : 'N/A'}</td>
            <td>${r && r.vmIp ? r.vmIp : 'N/A'}</td>
            <td>
                <span class="badge ${isSuccess ? 'bg-success' : 'bg-danger'}">
                    ${isSuccess ? 'Success' : 'Failed'}
                </span>
            </td>
            <td>
                ${isSuccess ?
                `<small class="text-muted">${r.stdout?.['0'] || 'Command executed successfully'}</small>` :
                `<div class="d-flex align-items-center justify-content-start">
                        <button class="btn btn-outline-primary btn-sm" onclick="event.stopPropagation(); retryVMCommand('${r.vmId}', ${globalIndex})" title="Retry command for this VM">
                            <i class="ti ti-refresh"></i> Retry
                        </button>
                    </div>`
            }
            </td>
        </tr>
        `;
    }).join('');

    // 현재 페이지 업데이트
    window.currentCommandResultPage = page;
}

function generateCommandResultPagination(totalPages) {
    const pagination = document.getElementById('commandResultPagination');
    if (!pagination || totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'block';
    const ul = pagination.querySelector('ul');
    ul.innerHTML = '';

    // 이전 버튼
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${window.currentCommandResultPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changeCommandResultPage(${window.currentCommandResultPage - 1})">Previous</a>`;
    ul.appendChild(prevLi);

    // 페이지 번호 버튼들
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === window.currentCommandResultPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changeCommandResultPage(${i})">${i}</a>`;
        ul.appendChild(li);
    }

    // 다음 버튼
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${window.currentCommandResultPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changeCommandResultPage(${window.currentCommandResultPage + 1})">Next</a>`;
    ul.appendChild(nextLi);
}

function initFileTransfer(targetType, nsId, mciId, targetId) {
    let fileContents = [];

    // targetType에 따라 다른 ID 사용
    let dropzoneId, buttonId, pathInputId;

    if (targetType === 'mci') {
        dropzoneId = '#mci-dropzone-custom';
        buttonId = 'mci-show-content-btn';
        pathInputId = 'mci-file-path-input';
    } else if (targetType === 'subgroup') {
        dropzoneId = '#subgroup-dropzone-custom';
        buttonId = 'subgroup-show-content-btn';
        pathInputId = 'subgroup-file-path-input';
    } else {
        // vm 타입
        dropzoneId = '#dropzone-custom';
        buttonId = 'show-content-btn';
        pathInputId = 'file-path-input';
    }

    // Dropzone 초기화
    setTimeout(() => {
        const dropzoneElement = document.querySelector(dropzoneId);

        if (dropzoneElement && !dropzoneElement.dropzone) {
            dropzoneInstance = new Dropzone(dropzoneId, {
                autoProcessQueue: false,
                addRemoveLinks: true,
                acceptedFiles: ".txt,.json,.yaml,.yml,.conf,.log,.sh",
                maxFilesize: 10, // 10MB
                clickable: true,
                init: function () {
                    this.on("addedfile", function (file) {
                        if (file instanceof File) {
                            // 중복 파일 체크
                            const isDuplicate = fileContents.some(existingFile =>
                                existingFile.name === file.name && existingFile.size === file.size
                            );

                            if (!isDuplicate) {
                                fileContents.push(file);
                            }
                        }
                    });
                }
            });
        } else if (dropzoneElement && dropzoneElement.dropzone) {
            // Dropzone already initialized
        }
    }, 100);

    // 파일 전송 버튼 이벤트 리스너
    const transferButton = document.getElementById(buttonId);
    if (transferButton) {
        // 기존 이벤트 리스너 제거
        transferButton.replaceWith(transferButton.cloneNode(true));
        const newTransferButton = document.getElementById(buttonId);

        newTransferButton.addEventListener("click", async function () {
            if (fileContents.length > 0) {
                const targetPath = document.getElementById(pathInputId).value;

                // 아코디언 접기 (Bootstrap 자동 처리)
                // data-bs-toggle="collapse" 속성으로 자동 처리됨

                // 모든 파일을 한 번에 처리
                try {
                    await transferFilesToMci(fileContents, targetPath, nsId, mciId, targetType, targetId);

                    // 전송 완료 후 파일 목록 초기화
                    fileContents = [];
                    if (dropzoneInstance) {
                        dropzoneInstance.removeAllFiles(true);
                    }
                } catch (error) {
                    alert("File transfer failed: " + error.message);
                    console.error(error);
                }
            } else {
                alert("No file available or file not loaded.");
            }
        });
    }
}

function showTransferError(fileName, error) {
    alert(`Transfer failed: ${fileName} - ${error.message}`);
    console.error(`Transfer failed: ${fileName}`, error);
}

// 전역 함수들 등록
window.changeCommandResultPage = function (page) {
    const totalPages = Math.ceil(window.commandResultData.length / window.commandResultItemsPerPage);

    if (page < 1 || page > totalPages) return;

    showCommandResultPage(page);
    generateCommandResultPagination(totalPages);
};

window.showResultDetail = function (index) {
    const results = window.commandResultData;
    if (!results || index < 0 || index >= results.length) return;

    const result = results[index];
    const detailArea = document.getElementById('resultDetailArea');
    if (!detailArea) return;

    // VM ID 가져오기
    const vmId = result && result.vmId ? result.vmId : 'Unknown';

    let detailText = '';
    if (result.error && result.error !== '') {
        detailText = `[output console: ${vmId}]\n---------------------------\n${result.error}`;
    } else if (result.stdout) {
        const stdoutContent = Object.values(result.stdout).join('\n');
        detailText = `[output console: ${vmId}]\n---------------------------\n${stdoutContent}`;
    } else if (result.stderr) {
        const stderrContent = Object.values(result.stderr).join('\n');
        detailText = `[output console: ${vmId}]\n---------------------------\n${stderrContent}`;
    } else {
        detailText = `[output console: ${vmId}]\n---------------------------\nNo detailed output available`;
    }

    detailArea.textContent = detailText;
    detailArea.style.whiteSpace = 'pre-wrap';

    // 선택된 행 하이라이트
    const tbody = document.getElementById('commandResultTableBody');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => row.classList.remove('table-active'));

        const currentPage = window.currentCommandResultPage;
        const itemsPerPage = window.commandResultItemsPerPage;
        const localIndex = index - (currentPage - 1) * itemsPerPage;

        if (localIndex >= 0 && localIndex < rows.length) {
            rows[localIndex].classList.add('table-active');
        }
    }
};

window.executeCommandAgain = function () {
    if (!window.lastCommandResult) return;

    const { command, targetType } = window.lastCommandResult;

    // 결과 모달 닫기
    const modalElement = document.getElementById('commandResultModal');
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    }

    // targetType에 따라 다른 ID 사용
    let commandInputId, inputSectionId, resultsSectionId;

    if (targetType === 'mci') {
        commandInputId = 'mci-command-input';
        inputSectionId = 'mci-command-input-section';
        resultsSectionId = 'mci-command-results-section';
    } else if (targetType === 'subgroup') {
        commandInputId = 'subgroup-command-input';
        inputSectionId = 'subgroup-command-input-section';
        resultsSectionId = 'subgroup-command-results-section';
    } else {
        console.error('executeCommandAgain: Invalid targetType:', targetType);
        return;
    }

    // 결과 섹션 숨기고 입력 섹션 표시
    document.getElementById(resultsSectionId).style.display = 'none';
    document.getElementById(inputSectionId).style.display = 'block';

    // 명령어 입력 필드에 이전 명령어 설정하고 포커스
    const commandInput = document.getElementById(commandInputId);
    if (commandInput) {
        commandInput.value = command;
        commandInput.focus();
        commandInput.select(); // 텍스트 선택
    }
};

window.retryVMCommand = retryVMCommand;
