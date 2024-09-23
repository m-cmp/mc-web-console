
// sidebar.html 에 path 지정 시 id="sidebar_workflow_manage" 3단계로 구성. 3번째 항목의 classList에 active
document.addEventListener("DOMContentLoaded", function () {
    try {
    const path = window.location.pathname.split('/');
    console.log("path ", path)
    const depth2 = 'sidebar_' + path[3]
    const depth3 = 'sidebar_' + path[3] + '_' + path[4]
    console.log("depth2 ", depth2)
    document.getElementsByName(depth2).forEach(i => i.classList.add('show', 'active'));
    document.getElementById(depth3).classList.add('active');
    } catch (error) {
        console.log('An error occurred navbar.js:', error.message);
    }

    let clickCount = 0;
    const maxClicks = 5;
    const clickInterval = 600;
    const linkElement = document.getElementById('customLink');
    linkElement.addEventListener('click', function(event) {
        event.preventDefault();
        clickCount++;
        setTimeout(() => {
            if (clickCount >= maxClicks) {
                window.location.href = '/dev/apicall';
            } else if (clickCount === 1) {
                window.location.href = '/';
            }
            clickCount = 0;
        }, clickInterval);
    });
});