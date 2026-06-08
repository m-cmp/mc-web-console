import { TabulatorFull as Tabulator } from "tabulator-tables";

const DOM = {
  approvalsTable: document.getElementById('approvals-table'),
  viewModeCards: document.getElementById('view-mode-cards'),
  approvalInfoUsername: document.getElementById('approval-info-username'),
  approvalInfoUsernameText: document.getElementById('approval-info-username-text'),
  approvalInfoFirstname: document.getElementById('approval-info-firstname'),
  approvalInfoLastname: document.getElementById('approval-info-lastname'),
  approvalInfoEmail: document.getElementById('approval-info-email'),
  approvalInfoUserid: document.getElementById('approval-info-userid'),
  approvalInfoCreatedAt: document.getElementById('approval-info-created-at'),
};

const AppState = {
  users: {
    list: [],
    pendingList: [],
    selectedUser: null,
  },
  tables: {
    approvalsTable: null,
  },
};

var checked_array = [];
var _rejectTargetUserId = null;

function filterPendingUsers(list) {
  return list.filter(function(user) {
    const enabled = user.enabled !== undefined ? user.enabled :
                    user.Enabled !== undefined ? user.Enabled :
                    user.status === 'active' || user.Status === 'active';
    return enabled === false;
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

const UIManager = {
  showViewMode() {
    if (DOM.viewModeCards) DOM.viewModeCards.classList.add('show');
  },

  hideViewMode() {
    if (DOM.viewModeCards) DOM.viewModeCards.classList.remove('show');
  },

  updateDetail(user) {
    if (!user) { this.clearDetail(); return; }

    const firstName  = user.firstName  || user.first_name  || user.FirstName  || '';
    const lastName   = user.lastName   || user.last_name   || user.LastName   || '';
    const email      = user.email      || user.Email       || '';
    const username   = user.username   || user.userName    || user.UserName   || user.id || '';
    const createdAt  = user.createdAt  || user.created_at  || user.CreatedAt
                    || user.createdTimestamp || '';

    if (DOM.approvalInfoFirstname)  DOM.approvalInfoFirstname.textContent  = firstName;
    if (DOM.approvalInfoLastname)   DOM.approvalInfoLastname.textContent   = lastName;
    if (DOM.approvalInfoEmail)      DOM.approvalInfoEmail.textContent      = email;
    if (DOM.approvalInfoUserid)     DOM.approvalInfoUserid.textContent     = username;
    if (DOM.approvalInfoCreatedAt)  DOM.approvalInfoCreatedAt.textContent  = formatDate(createdAt);

    if (DOM.approvalInfoUsername && DOM.approvalInfoUsernameText) {
      const displayName = (`${firstName} ${lastName}`).trim() || email;
      DOM.approvalInfoUsernameText.textContent = displayName;
      DOM.approvalInfoUsername.style.display = 'inline';
    }
  },

  clearDetail() {
    if (DOM.approvalInfoFirstname)  DOM.approvalInfoFirstname.textContent  = '';
    if (DOM.approvalInfoLastname)   DOM.approvalInfoLastname.textContent   = '';
    if (DOM.approvalInfoEmail)      DOM.approvalInfoEmail.textContent      = '';
    if (DOM.approvalInfoUserid)     DOM.approvalInfoUserid.textContent     = '';
    if (DOM.approvalInfoCreatedAt)  DOM.approvalInfoCreatedAt.textContent  = '';
    if (DOM.approvalInfoUsername)   DOM.approvalInfoUsername.style.display = 'none';
  },
};

const TableManager = {
  async initApprovalsTable() {
    return new Promise(function(resolve, reject) {
      if (AppState.tables.approvalsTable) {
        AppState.tables.approvalsTable.destroy();
        AppState.tables.approvalsTable = null;
      }

      const tableElement = DOM.approvalsTable;
      if (!tableElement) {
        reject(new Error("approvals-table element not found"));
        return;
      }

      try {
        const table = new Tabulator("#approvals-table", {
          data: [],
          layout: "fitColumns",
          height: 400,
          pagination: true,
          paginationSize: 10,
          paginationSizeSelector: [10, 25, 50],
          reactiveData: true,
          columns: TableManager.getColumns(),
        });

        AppState.tables.approvalsTable = table;

        table.on("tableBuilt", function() {
          resolve();
        });

        table.on("rowClick", function(e, row) {
          row.toggleSelect();
          const userId = row.getCell("id").getValue();
          const user = AppState.users.pendingList.find(function(u) { return u.id === userId; });
          if (user) {
            AppState.users.selectedUser = user;
            UIManager.updateDetail(user);
            UIManager.showViewMode();
          }
        });

        table.on("rowSelectionChanged", function(data) {
          checked_array = data;
        });

      } catch (error) {
        console.error("Error initializing approvals table:", error);
        reject(error);
      }
    });
  },

  getColumns() {
    return [
      {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        vertAlign: "middle",
        hozAlign: "center",
        headerHozAlign: "center",
        headerSort: false,
        width: 60,
      },
      { title: "Id", field: "id", visible: false },
      {
        title: "Name",
        field: "name",
        sorter: "string",
        formatter: function(cell) {
          const u = cell.getRow().getData();
          const fn = u.firstName || u.first_name || u.FirstName || '';
          const ln = u.lastName  || u.last_name  || u.LastName  || '';
          return (`${fn} ${ln}`).trim() || u.email || u.Email || '';
        },
      },
      {
        title: "Email",
        field: "email",
        sorter: "string",
        formatter: function(cell) {
          const u = cell.getRow().getData();
          return u.email || u.Email || '';
        },
      },
      {
        title: "Username",
        field: "username",
        formatter: function(cell) {
          const u = cell.getRow().getData();
          return u.username || u.userName || u.UserName || '';
        },
      },
      {
        title: "Requested At",
        field: "createdAt",
        sorter: "string",
        formatter: function(cell) {
          const u = cell.getRow().getData();
          const dt = u.createdAt || u.created_at || u.CreatedAt || u.createdTimestamp || '';
          return formatDate(dt);
        },
      },
      {
        title: "Actions",
        field: "actions",
        headerSort: false,
        hozAlign: "center",
        width: 160,
        formatter: function(cell) {
          const u = cell.getRow().getData();
          return `<div class="btn-list flex-nowrap">
            <button class="btn btn-sm btn-success"
              onclick="event.stopPropagation(); approveUser('${u.id}')">Approve</button>
            <button class="btn btn-sm btn-danger"
              onclick="event.stopPropagation(); openRejectModal('${u.id}')">Reject</button>
          </div>`;
        },
      },
    ];
  },
};

// 목록 재조회 및 테이블 갱신
async function initApprovals() {
  try {
    UIManager.hideViewMode();
    UIManager.clearDetail();
    AppState.users.selectedUser = null;
    checked_array = [];

    await TableManager.initApprovalsTable();

    const userList = await webconsolejs["common/api/services/users_api"].getUserList();
    const allUsers = userList || [];
    const pending  = filterPendingUsers(allUsers);

    AppState.users.list        = allUsers;
    AppState.users.pendingList = pending;

    if (AppState.tables.approvalsTable) {
      AppState.tables.approvalsTable.setData(pending);
    }
  } catch (error) {
    console.error("Error in initApprovals:", error);
  }
}

// 단건 승인 (행 액션 버튼)
window.approveUser = async function(userId) {
  if (!confirm('Approve this user?')) return;
  try {
    await webconsolejs["common/api/services/users_api"].updateUserStatus(userId, 'approved');
    await initApprovals();
  } catch (error) {
    console.error('Error approving user:', error);
    alert('Failed to approve user: ' + error.message);
  }
};

// 일괄 승인 (페이지 헤더 버튼)
window.approveSelected = async function() {
  if (checked_array.length === 0) {
    alert('No users selected.');
    return;
  }
  if (!confirm(`Approve ${checked_array.length} user(s)?`)) return;
  try {
    for (const user of checked_array) {
      await webconsolejs["common/api/services/users_api"].updateUserStatus(user.id, 'approved');
    }
    checked_array = [];
    await initApprovals();
  } catch (error) {
    console.error('Error approving selected users:', error);
    alert('Failed to approve users: ' + error.message);
  }
};

// 상세 패널에서 선택된 사용자 승인
window.approveSelectedUser = async function() {
  const user = AppState.users.selectedUser;
  if (!user) { alert('Please select a user.'); return; }
  if (!confirm(`Approve user "${user.username || user.userName || user.id}"?`)) return;
  try {
    await webconsolejs["common/api/services/users_api"].updateUserStatus(user.id, 'approved');
    await initApprovals();
  } catch (error) {
    console.error('Error approving user:', error);
    alert('Failed to approve user: ' + error.message);
  }
};

// 행 액션 버튼 — 거부 모달 오픈
window.openRejectModal = function(userId) {
  _rejectTargetUserId = userId;
  const textarea = document.getElementById('reject-reason-text');
  if (textarea) textarea.value = '';
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('reject-reason-modal'));
  modal.show();
};

// 상세 패널에서 선택된 사용자 거부 모달 오픈
window.openRejectModalForSelected = function() {
  const user = AppState.users.selectedUser;
  if (!user) { alert('Please select a user.'); return; }
  openRejectModal(user.id);
};

// 거부 확인
window.confirmReject = async function() {
  if (!_rejectTargetUserId) return;
  try {
    await webconsolejs["common/api/services/users_api"].updateUserStatus(_rejectTargetUserId, 'disabled');
    const modal = bootstrap.Modal.getInstance(document.getElementById('reject-reason-modal'));
    if (modal) modal.hide();
    _rejectTargetUserId = null;
    await initApprovals();
  } catch (error) {
    console.error('Error rejecting user:', error);
    alert('Failed to reject user: ' + error.message);
  }
};

// webconsolejs 등록 (refresh용 외부 호출 허용)
if (typeof webconsolejs !== 'undefined') {
  webconsolejs["pages/settings/accountnaccess/organizations/approvals"] = { initApprovals };
}

document.addEventListener("DOMContentLoaded", async function() {
  // 페이지 헤더 버튼: Approve Selected + Refresh
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <button type="button" class="btn btn-success" onclick="approveSelected()">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M5 12l5 5l10 -10"></path>
        </svg>
        Approve Selected
      </button>
      <button type="button" class="btn btn-outline-secondary ms-2" onclick="webconsolejs['pages/settings/accountnaccess/organizations/approvals'].initApprovals()">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"></path>
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path>
        </svg>
        Refresh
      </button>`;
  }

  await initApprovals();
});
