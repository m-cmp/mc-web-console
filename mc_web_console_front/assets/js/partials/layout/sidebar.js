
// sidebar.html 에 path 지정 시 id="sidebar_workflow_manage" 3단계로 구성. 3번째 항목의 classList에 active
document.addEventListener("DOMContentLoaded", function () {
    const path = window.location.pathname.split('/');    
    const depth2 = 'sidebar_'+ path[3]
    const depth3 = 'sidebar_'+path[3]+'_'+path[4]    

    document.getElementsByName(depth2).forEach(i => i.classList.add('show', 'active'));
    document.getElementById(depth3).classList.add('active');
});