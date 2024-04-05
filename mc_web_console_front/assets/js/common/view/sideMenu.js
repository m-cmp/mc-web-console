document.addEventListener("DOMContentLoaded", function () {
    const path = window.location.pathname.split('/')
    const category = 'sidebar_'+ path[2]
    const page = 'sidebar_'+path[2]+'_'+path[3]
    document.getElementsByName(category).forEach(i => i.classList.add('show', 'active'));
    document.getElementById(page).classList.add('active');
});