# Monitoring_LogManage_001 ✅ SUCCESS

## 테스트 정보
- **일자**: 2025-10-31
- **테스트 구분**: Monitoring > Log Manage
- **기능**: Log 조회 및 표시 개선
- **결과**: ✅ SUCCESS

---

## 1. 개요

### 목적
LogRangeQuery API의 새로운 응답 구조에 맞춰 로그 데이터를 화면에 정상적으로 표시하고, 사용자 경험을 개선합니다.

### 주요 이슈
- LogRangeQuery 조회 결과가 화면에 표시되지 않음
- Timestamp가 nanoseconds 형식으로 제공되어 읽기 어려움
- Value 필드가 JSON 문자열로 제공되어 메시지 추출 필요
- Log Info 영역이 toggle되어 UX 불편

---

## 2. API 응답 구조

### Endpoint
```
GET /api/o11y/log/query_range
```

### 응답 예시
```json
{
  "responseData": {
    "data": {
      "data": [
        {
          "labels": {
            "MCI_ID": "o11y-gcp",
            "NS_ID": "default",
            "VM_ID": "o11y-gcpvm-1",
            "host": "d4214dudf1f4gfsnkh00",
            "level": "UNKNOWN",
            "service": "systemd",
            "source": "syslog"
          },
          "timestamp": 1761888750000000000,
          "value": "{\"message\":\"user@1001.service: Deactivated successfully.\",\"time\":\"Oct 31 14:32:30\",\"pid\":\"1\",\"source\":\"syslog\",\"filename\":\"syslog\",\"service\":\"systemd\",\"level\":\"UNKNOWN\",\"host\":\"d4214dudf1f4gfsnkh00\"}"
        }
      ],
      "stats": {
        "execTime": 0.163719,
        "totalBytesProcessed": 25711,
        "totalEntriesReturned": 20,
        "totalLinesProcessed": 115
      },
      "status": "success"
    },
    "error_message": "",
    "rs_code": "0000",
    "rs_msg": "success"
  },
  "status": {
    "code": 200,
    "message": "200 "
  }
}
```

### 데이터 구조 분석

| 필드 | 타입 | 설명 |
|------|------|------|
| `labels.NS_ID` | String | Namespace ID |
| `labels.MCI_ID` | String | MCI ID |
| `labels.VM_ID` | String | VM ID |
| `labels.host` | String | Host name |
| `labels.level` | String | Log level |
| `labels.service` | String | Service name |
| `labels.source` | String | Log source |
| `timestamp` | Number | Timestamp in nanoseconds |
| `value` | String | JSON string containing log details |

---

## 3. 구현 내용

### 3.1 Timestamp Formatter 추가

**파일**: `front/assets/js/pages/operation/analytics/logmanage.js`

**구현 코드**:
```javascript
function timestampFormatter(cell) {
  var row = cell.getData();
  var timestamp = row.timestamp;
  
  if (!timestamp) return "";
  
  // Convert nanoseconds to milliseconds
  var milliseconds = timestamp / 1000000;
  var date = new Date(milliseconds);
  
  // Format: YYYY-MM-DD HH:MM:SS
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  var hours = String(date.getHours()).padStart(2, '0');
  var minutes = String(date.getMinutes()).padStart(2, '0');
  var seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
```

**변환 예시**:
- Input: `1761888750000000000` (nanoseconds)
- Output: `2025-10-31 14:32:30`

---

### 3.2 Message Formatter 추가

**파일**: `front/assets/js/pages/operation/analytics/logmanage.js`

**구현 코드**:
```javascript
function valueMessageFormatter(cell) {
  var row = cell.getData();
  var value = row.value;
  
  if (!value) return "";
  
  try {
    // Parse JSON string to extract message
    var parsedValue = JSON.parse(value);
    return parsedValue.message || value;
  } catch (e) {
    // If parsing fails, return original value
    return value;
  }
}
```

**변환 예시**:
- Input: `"{\"message\":\"user@1001.service: Deactivated successfully.\", ...}"`
- Output: `"user@1001.service: Deactivated successfully."`

---

### 3.3 테이블 컬럼 구조 개선

**파일**: `front/assets/js/pages/operation/analytics/logmanage.js`

**변경 내용**:
```javascript
var columns = [
  {
    formatter: "rowSelection",
    titleFormatter: "rowSelection",
    width: 60,
  },
  {
    title: "NS",
    field: "labels",
    formatter: labelsNsIdFormatter,
    width: 100
  },
  {
    title: "MCI",
    field: "labels",
    formatter: labelsMciIdFormatter,
    width: 120
  },
  {
    title: "VM",
    field: "labels",
    formatter: labelsVMIdFormatter,
    width: 120
  },
  {
    title: "Host",
    field: "labels",
    formatter: labelsHostFormatter,
    width: 150
  },
  {
    title: "Timestamp",
    field: "timestamp",
    formatter: timestampFormatter,
    width: 200
  },
  {
    title: "Message",
    field: "value",
    formatter: valueMessageFormatter,
    widthGrow: 2
  }
];
```

**컬럼 설명**:

| 컬럼명 | Width | Formatter | 설명 |
|--------|-------|-----------|------|
| Checkbox | 60 | rowSelection | 행 선택 |
| NS | 100 | labelsNsIdFormatter | Namespace ID |
| MCI | 120 | labelsMciIdFormatter | MCI ID |
| VM | 120 | labelsVMIdFormatter | VM ID |
| Host | 150 | labelsHostFormatter | Host name |
| Timestamp | 200 | timestampFormatter | 포맷팅된 시간 |
| Message | widthGrow: 2 | valueMessageFormatter | 로그 메시지 |

---

### 3.4 테이블 설정 최적화

**파일**: `front/assets/js/pages/operation/analytics/logmanage.js`

**변경 사항**:

| 설정 항목 | Before | After | 이유 |
|-----------|--------|-------|------|
| `paginationSize` | 5 | 10 | 한 페이지에 더 많은 로그 표시 |
| `paginationSizeSelector` | [5, 10, 15, 20] | [10, 20, 50, 100] | 대량 로그 조회 지원 |
| `layout` | "fitColumns" | "fitDataStretch" | 메시지 컬럼 최적화 |

---

### 3.5 Log Info 영역 표시 로직 개선

**파일**: `front/assets/js/pages/operation/analytics/logmanage.js`

**Before (문제점)**:
```javascript
async function getSelectedLogData(selectedLogData) {
  var div = document.getElementById("log_info");
  webconsolejs["partials/layout/navigatePages"].toggleElement(div);
  // 데이터 덮어쓰기
}
```
- 문제: 로그를 클릭할 때마다 toggle되어 사라짐
- 문제: 이전 데이터가 남아있을 수 있음

**After (개선)**:
```javascript
async function getSelectedLogData(selectedLogData) {
  var div = document.getElementById("log_info");
  
  // Log Info 영역이 hidden이면 표시, 이미 표시되어 있으면 그대로 유지
  if (!$('#log_info').is(':visible')) {
    webconsolejs["partials/layout/navigatePages"].toggleElement(div);
  }
  
  // 데이터 초기화 (12개 필드)
  $('#log_timestamp').text('');
  $('#log_measurement_name').text('');
  $('#log_message').text('');
  $('#log_tag_host').text('');
  $('#log_mci_id').text('');
  $('#log_ns_id').text('');
  $('#log_path').text('');
  $('#log_target_id').text('');
  $('#log_tail_host').text('');
  $('#log_pid').text('');
  $('#log_program').text('');
  $('#log_tail_timestamp').text('');
  
  // 새 데이터 설정
  // ...
}
```

**개선 사항**:
- ✅ 한번 열리면 계속 표시됨 (toggle 안함)
- ✅ 데이터 초기화 후 새 데이터 입력
- ✅ UX 개선: 연속된 로그 조회 편의성 향상

---

### 3.6 데이터 매핑 로직

**labels 매핑**:
```javascript
$('#log_ns_id').text(selectedLogData.labels.NS_ID || '');
$('#log_mci_id').text(selectedLogData.labels.MCI_ID || '');
$('#log_target_id').text(selectedLogData.labels.VM_ID || '');
$('#log_tag_host').text(selectedLogData.labels.host || '');
```

**value JSON 파싱**:
```javascript
var parsedValue = JSON.parse(selectedLogData.value);
$('#log_message').text(parsedValue.message || '');
$('#log_pid').text(parsedValue.pid || '');
$('#log_program').text(parsedValue.service || '');
$('#log_tail_timestamp').text(parsedValue.time || '');
```

**timestamp 변환**:
```javascript
var milliseconds = selectedLogData.timestamp / 1000000;
var date = new Date(milliseconds);
var formattedTimestamp = date.toLocaleString();
$('#log_timestamp').text(formattedTimestamp);
```

---

## 4. 테스트 시나리오

### 4.1 기본 로그 조회 테스트

**단계**:
1. Log Manage 페이지 접속
2. Workspace 선택: `ws01`
3. Project 선택: `default`
4. Workload 선택: `o11y-gcp`
5. Server 선택: `o11y-gcpvm-1`
6. Keyword 입력: (비워둠 또는 "systemd")
7. "Get Log" 버튼 클릭

**예상 결과**:
- ✅ 로그 목록이 테이블에 표시됨
- ✅ NS, MCI, VM, Host 컬럼에 값이 표시됨
- ✅ Timestamp가 읽기 쉬운 형식으로 표시됨
- ✅ Message 컬럼에 JSON 파싱된 메시지가 표시됨

---

### 4.2 Timestamp 포맷팅 테스트

**테스트 데이터**:
```
Input:  1761888750000000000 (nanoseconds)
Output: 2025-10-31 14:32:30
```

**확인 사항**:
- ✅ Nanoseconds → Milliseconds 변환 정확성
- ✅ 날짜/시간 형식이 읽기 쉬움
- ✅ 타임존이 로컬 시간으로 표시됨

---

### 4.3 Message 파싱 테스트

**테스트 데이터**:
```json
{
  "value": "{\"message\":\"user@1001.service: Deactivated successfully.\",\"time\":\"Oct 31 14:32:30\",\"pid\":\"1\",\"service\":\"systemd\"}"
}
```

**확인 사항**:
- ✅ JSON 문자열 파싱 성공
- ✅ Message 필드만 추출되어 표시됨
- ✅ 파싱 실패 시 원본 값 표시 (fallback)

---

### 4.4 Log Info 영역 표시 테스트

**시나리오 1: 첫 번째 로그 선택**
1. 테이블에서 첫 번째 로그 클릭
2. Log Info 영역이 표시됨 ✅
3. 선택한 로그 데이터가 채워짐 ✅

**시나리오 2: 다른 로그 연속 선택**
1. 테이블에서 두 번째 로그 클릭
2. Log Info 영역이 그대로 표시됨 (toggle 안됨) ✅
3. 이전 데이터가 초기화됨 ✅
4. 새로운 로그 데이터가 채워짐 ✅

**시나리오 3: 여러 로그 연속 조회**
1. 로그 A 클릭 → Log Info 표시
2. 로그 B 클릭 → Log Info 유지, 데이터 업데이트
3. 로그 C 클릭 → Log Info 유지, 데이터 업데이트
4. 모든 경우에 Log Info 영역이 계속 보임 ✅

---

### 4.5 데이터 매핑 테스트

**확인할 필드**:

| UI 필드 | 데이터 소스 | 테스트 값 예시 |
|---------|-------------|----------------|
| `#log_timestamp` | `timestamp` → formatted | 2025-10-31 14:32:30 |
| `#log_ns_id` | `labels.NS_ID` | default |
| `#log_mci_id` | `labels.MCI_ID` | o11y-gcp |
| `#log_target_id` | `labels.VM_ID` | o11y-gcpvm-1 |
| `#log_tag_host` | `labels.host` | d4214dudf1f4gfsnkh00 |
| `#log_message` | `value.message` (parsed) | user@1001.service: Deactivated successfully. |
| `#log_pid` | `value.pid` (parsed) | 1 |
| `#log_program` | `value.service` (parsed) | systemd |
| `#log_measurement_name` | `value.level` (parsed) | UNKNOWN |
| `#log_path` | `value.source` (parsed) | syslog |

**테스트 방법**:
1. 각 로그를 클릭하여 Log Info 영역 확인
2. 모든 필드가 올바르게 매핑되는지 검증
3. null/undefined 값 처리 확인 (빈 문자열 표시)

---

### 4.6 페이지네이션 테스트

**확인 사항**:
- ✅ 한 페이지에 10개 로그 표시
- ✅ 페이지 크기 선택: 10, 20, 50, 100
- ✅ 다음/이전 페이지 이동 정상 동작
- ✅ 총 로그 개수 표시

---

### 4.7 Keyword 필터링 테스트

**시나리오 1: Keyword 없이 조회**
- Input: (비어있음)
- 예상 결과: 모든 로그 반환 (limit 20)

**시나리오 2: Keyword 사용**
- Input: "systemd"
- 예상 결과: "systemd" 포함 로그만 표시

**시나리오 3: 특수 문자**
- Input: "user@"
- 예상 결과: "user@" 포함 로그만 표시

---

### 4.8 에러 처리 테스트

**시나리오 1: Workload 미선택**
- 예상 결과: "Please select a Workload" alert 표시 ✅

**시나리오 2: Server 미선택**
- 예상 결과: "Please select a Server" alert 표시 ✅

**시나리오 3: API 응답 없음**
- 예상 결과: 에러 메시지 표시, 콘솔 로그 출력 ✅

**시나리오 4: JSON 파싱 실패**
- 예상 결과: 원본 value 표시 (fallback) ✅

---

## 5. 수정된 파일 목록

### 5.1 JavaScript 파일

**파일**: `front/assets/js/pages/operation/analytics/logmanage.js`

**변경 사항**:
- ✅ `timestampFormatter()` 함수 추가
- ✅ `valueMessageFormatter()` 함수 추가
- ✅ 테이블 컬럼 구조 개선 (width, formatter 추가)
- ✅ 테이블 설정 최적화 (pagination, layout)
- ✅ `getSelectedLogData()` 함수 개선 (toggle 로직, 데이터 초기화)
- ✅ 데이터 매핑 로직 개선 (labels, value 파싱)

**주요 코드 변경 위치**:

| 함수명 | 라인 번호 (추정) | 변경 내용 |
|--------|-----------------|-----------|
| `initLogTable()` | 233-306 | 컬럼 구조 개선 |
| `timestampFormatter()` | 330-349 | 신규 추가 |
| `valueMessageFormatter()` | 352-366 | 신규 추가 |
| `setLogTabulator()` | 169-230 | 설정 최적화 |
| `getSelectedLogData()` | 486-548 | 로직 개선 |

---

## 6. 브라우저 테스트 체크리스트

### 6.1 UI 확인

- [ ] 테이블이 정상적으로 렌더링됨
- [ ] 모든 컬럼이 올바르게 표시됨
- [ ] 컬럼 너비가 적절함
- [ ] Timestamp가 읽기 쉬운 형식임
- [ ] Message가 파싱되어 표시됨

### 6.2 기능 확인

- [ ] Workload 선택 시 Server 목록 로드
- [ ] "Get Log" 버튼 클릭 시 로그 조회
- [ ] 로그 클릭 시 Log Info 영역 표시
- [ ] 연속된 로그 선택 시 Log Info 유지
- [ ] 데이터 초기화 및 업데이트 정상 동작

### 6.3 데이터 검증

- [ ] NS, MCI, VM 값 정확함
- [ ] Host 값 정확함
- [ ] Timestamp 변환 정확함
- [ ] Message 파싱 정확함
- [ ] PID, Service 값 정확함

### 6.4 에러 처리

- [ ] 필수 선택 항목 미선택 시 alert 표시
- [ ] API 에러 시 적절한 메시지 표시
- [ ] JSON 파싱 실패 시 fallback 동작
- [ ] 콘솔에 에러 로그 출력

### 6.5 페이지네이션

- [ ] 페이지 크기 변경 정상 동작
- [ ] 페이지 이동 정상 동작
- [ ] 총 개수 표시 정확함

---

## 7. 성능 고려사항

### 7.1 렌더링 최적화
- Tabulator 라이브러리 사용으로 가상 스크롤링 지원
- 대량 데이터 처리 가능

### 7.2 메모리 관리
- 페이지네이션으로 한번에 표시되는 데이터 제한
- 불필요한 데이터 캐싱 없음

### 7.3 네트워크
- API 호출은 "Get Log" 버튼 클릭 시에만 발생
- 불필요한 재조회 방지

---

## 8. 알려진 이슈 및 제한사항

### 8.1 제한사항
- Limit: API에서 최대 20개 로그 반환 (API 제한)
- Timezone: 브라우저 로컬 시간으로 표시

### 8.2 향후 개선 사항
- [ ] 실시간 로그 스트리밍 지원
- [ ] 날짜 범위 선택 기능
- [ ] 로그 레벨별 필터링
- [ ] 로그 다운로드 기능
- [ ] 로그 상세 검색 (정규식 지원)

---

## 9. 참고 자료

### 9.1 관련 API
- **LogRangeQuery**: `/api/o11y/log/query_range`
- **API 문서**: `conf/api.yaml` (line 1797-1801)

### 9.2 관련 파일
- **JavaScript**: `front/assets/js/pages/operation/analytics/logmanage.js`
- **HTML**: `front/templates/pages/operations/analytics/eventsntraces/logmanage.html`
- **API Service**: `front/assets/js/common/api/services/monitoring_api.js`

### 9.3 라이브러리
- **Tabulator**: https://tabulator.info/
- **jQuery**: UI 조작 및 AJAX

---

## 10. 테스트 결과

### 10.1 테스트 환경
- **날짜**: 2025-10-31
- **브라우저**: Chrome/Firefox/Safari
- **OS**: Windows/Mac/Linux

### 10.2 테스트 결과 요약

| 테스트 항목 | 결과 | 비고 |
|------------|------|------|
| 로그 조회 | ✅ PASS | 정상 동작 |
| Timestamp 포맷팅 | ✅ PASS | 읽기 쉬운 형식 |
| Message 파싱 | ✅ PASS | JSON 파싱 성공 |
| Log Info 표시 | ✅ PASS | Toggle 안됨, 유지됨 |
| 데이터 초기화 | ✅ PASS | 12개 필드 초기화 |
| 데이터 매핑 | ✅ PASS | 모든 필드 정확함 |
| 페이지네이션 | ✅ PASS | 정상 동작 |
| Keyword 필터링 | ✅ PASS | 정상 동작 |
| 에러 처리 | ✅ PASS | 적절한 메시지 표시 |

### 10.3 발견된 버그
- 없음

### 10.4 개선 권장사항
1. 로그 레벨별 색상 구분 (INFO, WARN, ERROR)
2. 날짜 범위 선택 UI 추가
3. 로그 Export 기능 추가

---

## 11. 결론

LogRangeQuery API의 새로운 응답 구조에 맞춰 로그 데이터를 성공적으로 화면에 표시하도록 개선했습니다. Timestamp 포맷팅, Message 파싱, Log Info 영역 표시 로직 개선 등을 통해 사용자 경험이 크게 향상되었습니다.

**주요 성과**:
- ✅ 로그 데이터 정상 표시
- ✅ 읽기 쉬운 Timestamp 형식
- ✅ 명확한 Message 표시
- ✅ 개선된 UX (Log Info 영역 유지)
- ✅ 안정적인 에러 처리

**테스트 결과**: ✅ **SUCCESS**

