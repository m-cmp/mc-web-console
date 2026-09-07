// Remote Command UI and Business Logic
// 터미널, 모달, 파일 전송 등 UI 관련 기능들

import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { Dropzone } from 'dropzone';
import { showCommandProgressToast, hideProgressToast, showProgressToast, showRetryProgressToast, showRetrySuccessToast, showRetryErrorToast } from '../../../common/utils/toast.js';
import { postRemoteCmd, postFileToMci, MAX_TRANSFER_FILE_SIZE, MAX_TRANSFER_FILE_SIZE_LABEL, formatFileSize } from '../../../common/api/services/remotecmd_api.js';

let terminalInstance = null;
let dropzoneInstance = null;

// 파괴적이거나 되돌릴 수 없는 명령 패턴.
// 차단이 아니라 확인 모달에 경고를 덧붙이는 용도 — false positive가 실행을 막지 않게 한다.
const DANGEROUS_COMMAND_PATTERNS = [
    // 플래그에 r 또는 f 가 있는 rm 만 매칭 (단순 `rm file.txt` 는 오탐이라 제외)
    { pattern: /\brm\s+(-{1,2}[a-zA-Z-]*\s+)*-{1,2}[a-zA-Z-]*[rf]/, label: 'Recursive/forced file deletion (rm)' },
    { pattern: /\bmkfs(\.\w+)?\b/, label: 'Filesystem creation (mkfs) — destroys existing data' },
    { pattern: /\bdd\s+.*\bof=/, label: 'Raw disk write (dd of=)' },
    { pattern: /\bfdisk\b|\bparted\b|\bsgdisk\b/, label: 'Disk partitioning (fdisk/parted/sgdisk)' },
    { pattern: /\b(shutdown|poweroff|halt|reboot|init\s+0|init\s+6)\b/, label: 'Node shutdown or reboot' },
    { pattern: /\bsystemctl\s+(stop|disable|mask)\b/, label: 'Service stop/disable (systemctl)' },
    { pattern: /\b(userdel|groupdel)\b/, label: 'User or group deletion' },
    { pattern: /\bchmod\s+(-R\s+)?0*777\b/, label: 'World-writable permission change (chmod 777)' },
    { pattern: />\s*\/dev\/[sh]d[a-z]/, label: 'Redirect to a raw block device' },
    { pattern: /\bcrontab\s+-r\b/, label: 'Crontab removal (crontab -r)' },
    { pattern: /\biptables\s+-F\b|\bufw\s+disable\b/, label: 'Firewall flush/disable' },
    { pattern: /:\(\)\s*\{.*\}\s*;\s*:/, label: 'Fork bomb' },
];

// HTML 삽입 전 이스케이프 (명령어·노드 ID를 그대로 렌더링하지 않는다)
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 실행 대상 노드 해석.
// vm은 지정한 노드 1대, nodegroup은 해당 그룹의 노드, mci는 Infra 전체 노드가 대상이다.
async function resolveTargetNodes(nsId, mciId, targetId, targetType) {
    if (targetType === 'vm') {
        return { nodeIds: targetId ? [targetId] : [], resolved: true };
    }

    try {
        const response = await webconsolejs["common/api/services/mci_api"].getMci(nsId, mciId);
        const nodes = (response && response.responseData && response.responseData.node) || [];
        const targetNodes = (targetType === 'nodegroup' && targetId)
            ? nodes.filter(node => node.nodeGroupId === targetId)
            : nodes;
        return { nodeIds: targetNodes.map(node => node.id).filter(Boolean), resolved: true };
    } catch (error) {
        console.error('Failed to resolve target nodes:', error);
        return { nodeIds: [], resolved: false };
    }
}

// 대상 범위를 사람이 읽는 문장으로 변환
function describeTargetScope(targetType, targetId, mciId, nodeInfo) {
    const scope = targetType === 'vm'
        ? `Node <code>${escapeHtml(targetId)}</code>`
        : targetType === 'nodegroup'
            ? `NodeGroup <code>${escapeHtml(targetId)}</code> of Infra <code>${escapeHtml(mciId)}</code>`
            : `Infra <code>${escapeHtml(mciId)}</code> (all NodeGroups)`;

    if (!nodeInfo.resolved) {
        return { scope, countText: 'Target node count could not be verified.', nodeIds: [] };
    }

    const count = nodeInfo.nodeIds.length;
    const countText = count === 1 ? 'This will run on 1 node.' : `This will run on ${count} nodes.`;
    return { scope, countText, nodeIds: nodeInfo.nodeIds };
}

// 대상 노드 목록 렌더링 (많으면 앞 10개만 표시)
function renderNodeList(nodeIds) {
    if (nodeIds.length === 0) return '';
    const shown = nodeIds.slice(0, 10).map(id => `<span class="badge bg-secondary me-1">${escapeHtml(id)}</span>`).join('');
    const rest = nodeIds.length > 10 ? `<span class="text-muted small">and ${nodeIds.length - 10} more</span>` : '';
    return `<div class="mb-3">${shown}${rest}</div>`;
}

// Promise 기반 확인 모달. 확인 시 true, 취소·닫기 시 false를 반환한다.
function showConfirmModal({ title, bodyHtml, confirmLabel }) {
    return new Promise(resolve => {
        const modalId = 'remotecmdConfirmModal';

        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            const existingInstance = bootstrap.Modal.getInstance(existingModal);
            if (existingInstance) existingInstance.dispose();
            existingModal.remove();
        }

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${escapeHtml(title)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">${bodyHtml}</div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="${modalId}-confirm-btn">${escapeHtml(confirmLabel)}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);
        let confirmed = false;

        modalElement.querySelector(`#${modalId}-confirm-btn`).addEventListener('click', () => {
            confirmed = true;
            modal.hide();
        });

        modalElement.addEventListener('hidden.bs.modal', () => {
            modal.dispose();
            modalElement.remove();
            resolve(confirmed);
        });

        modal.show();
    });
}

// 단발 실행 모달의 입력/결과 섹션 전환 (mci·nodegroup 전용).
// 대화형 vm 터미널은 이 섹션을 쓰지 않는다.
function setCommandSections(targetType, showResults) {
    if (targetType !== 'mci' && targetType !== 'nodegroup') return;
    const inputSection = document.getElementById(`${targetType}-command-input-section`);
    const resultsSection = document.getElementById(`${targetType}-command-results-section`);
    if (inputSection) inputSection.style.display = showResults ? 'none' : 'block';
    if (resultsSection) resultsSection.style.display = showResults ? 'block' : 'none';
}

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
    } else if (targetType === 'nodegroup') {
        dropzoneId = '#nodegroup-dropzone-custom';
        buttonId = 'nodegroup-show-content-btn';
        pathInputId = 'nodegroup-file-path-input';
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
                    const dz = this;
                    this.on("addedfile", function (file) {
                        if (file instanceof File) {
                            // 크기 검증 — Dropzone의 maxFilesize는 에러 표시만 하고
                            // addedfile 콜백은 그대로 호출되므로 여기서 직접 걸러낸다
                            if (file.size > MAX_TRANSFER_FILE_SIZE) {
                                dz.removeFile(file);
                                alert(`"${file.name}" is ${formatFileSize(file.size)}, which exceeds the ${MAX_TRANSFER_FILE_SIZE_LABEL} transfer limit.`);
                                return;
                            }

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

// MCI/NodeGroup용 단발성 명령어 실행 초기화 함수
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
    let commandInputId, executeButtonId, executeAgainButtonId;

    if (targetType === 'mci') {
        commandInputId = 'mci-command-input';
        executeButtonId = 'mci-execute-command-btn';
        executeAgainButtonId = 'mci-execute-again-btn';
    } else if (targetType === 'nodegroup') {
        commandInputId = 'nodegroup-command-input';
        executeButtonId = 'nodegroup-execute-command-btn';
        executeAgainButtonId = 'nodegroup-execute-again-btn';
    } else {
        console.error('initBatchCommandTerminal: Invalid targetType:', targetType);
        return;
    }

    // 이전 실행의 결과 화면이 남아 있지 않도록 입력 화면으로 되돌린다
    setCommandSections(targetType, false);

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

            // 결과 섹션 전환은 실행 확인 후에 executeBatchCommand 가 처리한다
            // (여기서 먼저 숨기면 확인 모달에서 취소했을 때 입력창이 사라진다)
            await executeBatchCommand(command, nsId, mciId, targetId, targetType);
        });
    }

    // Execute Again 버튼은 이제 결과 모달에서 처리됨

    // 파일 전송 기능 초기화 (기존 로직 유지)
    initFileTransfer(targetType, nsId, mciId, targetId);
}

// 명령어 실행 및 UI 처리
export async function executeBatchCommand(command, nsId, mciId, targetId, targetType) {
    // 0. 실행 전 가드 — 입력 검증 후 대상 노드 수를 보여주고 사용자 확인을 받는다
    const validation = validateCommandInput(command);
    if (!validation.valid) {
        showCommandError(command, new Error(validation.message));
        return;
    }

    const confirmed = await confirmCommandExecution(command, nsId, mciId, targetId, targetType, validation.dangerous);
    if (!confirmed) {
        return;
    }

    // 확인된 뒤에만 결과 섹션으로 전환한다
    setCommandSections(targetType, true);

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
    // 0. 전송 전 가드 — 크기 초과 파일을 걸러내고 대상 노드 수를 확인받는다
    const oversized = Array.from(files).filter(file => file.size > MAX_TRANSFER_FILE_SIZE);
    if (oversized.length > 0) {
        const names = oversized.map(file => `${file.name} (${formatFileSize(file.size)})`).join(', ');
        alert(`These files exceed the ${MAX_TRANSFER_FILE_SIZE_LABEL} transfer limit and cannot be sent: ${names}`);
        return;
    }

    const confirmed = await confirmFileTransfer(files, targetPath, nsId, mciId, targetId, targetType);
    if (!confirmed) {
        return;
    }

    // 대상 타입과 무관하게 파일별로 순차 전송한다 (결과 표시 함수만 다름)
    const results = [];

    for (const file of files) {
        try {
            // 1. 로딩 상태 표시
            showTransferProgress(file.name, 'uploading');

            // 2. PostFileToMci API 호출
            const result = await postFileToMci(nsId, mciId, file, targetPath, targetType, targetId);

            // 3. 진행 상태 토스트 숨기기
            hideProgressToast();

            // 4. 결과 저장 (모달은 전체 완료 후 한 번만 표시)
            results.push({ fileName: file.name, result: result });

        } catch (error) {
            // 5. 진행 상태 토스트 숨기기
            hideProgressToast();

            // 6. 에러 저장
            results.push({ fileName: file.name, error: error });
        }
    }

    // 7. 전체 결과 표시 (한 번만)
    if (targetType === 'vm') {
        showTransferResultsForVM(results);
    } else {
        showTransferResults(results);
    }
}

// 실행 전 검증/확인 함수들

// 명령어 입력 검증.
// 위험 명령은 차단하지 않고 dangerous로 표시만 한다 — 차단은 정당한 운영 명령까지 막는다.
export function validateCommandInput(command) {
    if (!command || typeof command !== 'string') {
        return { valid: false, message: 'Command must be a non-empty string', dangerous: [] };
    }

    const trimmedCommand = command.trim();
    if (trimmedCommand === '') {
        return { valid: false, message: 'Command cannot be empty', dangerous: [] };
    }

    const dangerous = DANGEROUS_COMMAND_PATTERNS
        .filter(entry => entry.pattern.test(trimmedCommand))
        .map(entry => entry.label);

    return { valid: true, dangerous };
}

// 원격 명령 실행 확인 모달 — 대상 범위·노드 수·명령어·위험 경고를 함께 보여준다
export async function confirmCommandExecution(command, nsId, mciId, targetId, targetType, dangerous = []) {
    const nodeInfo = await resolveTargetNodes(nsId, mciId, targetId, targetType);
    const { scope, countText, nodeIds } = describeTargetScope(targetType, targetId, mciId, nodeInfo);

    if (nodeInfo.resolved && nodeIds.length === 0) {
        alert('No target node was found for this command.');
        return false;
    }

    const warningHtml = dangerous.length > 0
        ? `<div class="alert alert-danger py-2">
               <strong>Potentially destructive command detected</strong>
               <ul class="mb-0 ps-3">${dangerous.map(label => `<li>${escapeHtml(label)}</li>`).join('')}</ul>
           </div>`
        : '';

    const bodyHtml = `
        <p class="mb-1">Target: ${scope}</p>
        <p class="fw-bold ${nodeIds.length > 1 ? 'text-danger' : ''}">${escapeHtml(countText)}</p>
        ${renderNodeList(nodeIds)}
        <p class="mb-1">Command:</p>
        <pre class="bg-light border rounded p-2 mb-3" style="max-height: 180px; overflow: auto;">${escapeHtml(command)}</pre>
        ${warningHtml}
    `;

    const confirmLabel = nodeIds.length > 0
        ? (nodeIds.length === 1 ? 'Run on 1 node' : `Run on ${nodeIds.length} nodes`)
        : 'Run command';

    return showConfirmModal({ title: 'Confirm Remote Command', bodyHtml, confirmLabel });
}

// 파일 전송 확인 모달 — 명령 실행과 같은 이유로 대상 노드 수를 먼저 확인받는다
export async function confirmFileTransfer(files, targetPath, nsId, mciId, targetId, targetType) {
    const nodeInfo = await resolveTargetNodes(nsId, mciId, targetId, targetType);
    const { scope, countText, nodeIds } = describeTargetScope(targetType, targetId, mciId, nodeInfo);

    if (nodeInfo.resolved && nodeIds.length === 0) {
        alert('No target node was found for this file transfer.');
        return false;
    }

    const fileListHtml = Array.from(files)
        .map(file => `<li><code>${escapeHtml(file.name)}</code> <span class="text-muted small">${escapeHtml(formatFileSize(file.size))}</span></li>`)
        .join('');

    const bodyHtml = `
        <p class="mb-1">Target: ${scope}</p>
        <p class="fw-bold ${nodeIds.length > 1 ? 'text-danger' : ''}">${escapeHtml(countText)}</p>
        ${renderNodeList(nodeIds)}
        <p class="mb-1">Destination path: <code>${escapeHtml(targetPath || '(not set)')}</code></p>
        <p class="mb-1">Files:</p>
        <ul class="mb-0">${fileListHtml}</ul>
    `;

    const confirmLabel = nodeIds.length > 0
        ? (nodeIds.length === 1 ? 'Transfer to 1 node' : `Transfer to ${nodeIds.length} nodes`)
        : 'Transfer files';

    return showConfirmModal({ title: 'Confirm File Transfer', bodyHtml, confirmLabel });
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
                                        <small class="text-muted">Node Transfer Complete</small>
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
                        
                        <h6>Node Transfer Details:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Node ID</th>
                                        <th>Node IP</th>
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
    window.currentMciId = window.currentMciId || window.currentNodeGroupId; // MCI ID 저장

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
                                        <th>Node ID</th>
                                        <th>Node IP</th>
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

        const response = Array.isArray(result && result.results) ? result.results[0] : null;
        if (!response) {
            const message = (result && (result.message || result.error)) || 'No command result returned by the remote command API';
            writeAutoWrap(term, " > Error: \x1b[1m\x1b[31m" + message + "\x1b[0m");
            callback({ error: message });
            return;
        }

        const callErr = response.err;
        const stdout = toOutputChunks(response.stdout);
        const stderr = toOutputChunks(response.stderr);

        if (callErr && Object.keys(callErr).length > 0) {
            const formattedError = JSON.stringify(callErr, null, 2);
            writeAutoWrap(term, " > connect Error: \x1b[1m\x1b[31m" + formattedError + "\x1b[0m");
            callback({ error: callErr });
            return;
        }

        if (stderr.some(value => value.trim() !== '')) {
            term.write('\r\n\x1b[1m\x1b[31mSTDERR RESPONSE:\r\n');
            stderr.forEach(value => {
                writeAutoWrap(term, value);
            });
            term.write("\x1b[0m\r\n");
        }

        if (stdout.some(value => value.trim() !== '')) {
            stdout.forEach(value => {
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

// PostCmdInfra는 stdout/stderr를 map[int]string(객체) 또는 단일 문자열로 돌려줄 수 있다.
// 두 형태를 출력 단위 배열로 통일한다.
function toOutputChunks(value) {
    if (!value) return [];
    if (typeof value === 'string') return [value];
    return Object.values(value).map(v => (typeof v === 'string' ? v : String(v)));
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
                                        <th>Node Count</th>
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
                        <button class="btn btn-outline-primary btn-sm" onclick="event.stopPropagation(); retryVMCommand('${r.vmId}', ${globalIndex})" title="Retry command for this Node">
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
    } else if (targetType === 'nodegroup') {
        dropzoneId = '#nodegroup-dropzone-custom';
        buttonId = 'nodegroup-show-content-btn';
        pathInputId = 'nodegroup-file-path-input';
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
                    const dz = this;
                    this.on("addedfile", function (file) {
                        if (file instanceof File) {
                            // 크기 검증 — Dropzone의 maxFilesize는 에러 표시만 하고
                            // addedfile 콜백은 그대로 호출되므로 여기서 직접 걸러낸다
                            if (file.size > MAX_TRANSFER_FILE_SIZE) {
                                dz.removeFile(file);
                                alert(`"${file.name}" is ${formatFileSize(file.size)}, which exceeds the ${MAX_TRANSFER_FILE_SIZE_LABEL} transfer limit.`);
                                return;
                            }

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
    let commandInputId;

    if (targetType === 'mci') {
        commandInputId = 'mci-command-input';
    } else if (targetType === 'nodegroup') {
        commandInputId = 'nodegroup-command-input';
    } else {
        console.error('executeCommandAgain: Invalid targetType:', targetType);
        return;
    }

    // 결과 섹션 숨기고 입력 섹션 표시
    setCommandSections(targetType, false);

    // 명령어 입력 필드에 이전 명령어 설정하고 포커스
    const commandInput = document.getElementById(commandInputId);
    if (commandInput) {
        commandInput.value = command;
        commandInput.focus();
        commandInput.select(); // 텍스트 선택
    }
};

window.retryVMCommand = retryVMCommand;
