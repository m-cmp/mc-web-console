function showSection() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    const hash = window.location.hash || '#index';
    const activeSection = document.querySelector(hash);
    if (activeSection) {
        activeSection.classList.add('active');
    }
}

function hideLoader() {
    document.getElementById("loader").classList.remove('active')
}

export function toggleElement(elem) {
    console.log("elem",elem)
    // 자기 자신에 대한 Toggle
    if (elem.classList.contains("active")) {
        elem.classList.remove('active')
        window.location.hash = ""
        return false
    } else {
        elem.classList.add('active')
        return true
    }
}

export function activeElement(elem) {
    elem.classList.add('active')
}

export function deactiveElement(elem) {
    elem.classList.remove('active')
}

export function toggleSubElement(elem) {
    // 자기 자신에 대한 Toggle
    if (elem.classList.contains("active")) {
        elem.classList.remove('active')
        // window.location.hash = ""
    } else {
        elem.classList.add('active')
    }
}

window.addEventListener('hashchange', showSection);
window.addEventListener('load', showSection);
window.addEventListener('load', hideLoader);


// PageHeader 오른쪽에 Button을 추가
/*
    ex) var targetSection = "mcicreate"
        var createBtnName ="Add Mci";
        var onclickEvent = "webconsolejs['partials/operation/manage/mcicreate'].addNewMci()";    
        addPageHeaderButton(targetSection, createBtnName, onclickEvent);
*/
export function addPageHeaderButton(targetSection, createBtnName, onclickEvent){
    console.log("addPageHeaderButton")
    var buttonHtml = `<a
      ${targetSection ? 'href="#'+targetSection +'"' : 'href="#"'}
      class="btn btn-primary"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M12 5l0 14"></path>
        <path d="M5 12l14 0"></path>
      </svg>
      ${createBtnName}
    </a>`;
    console.log("addPageHeaderButton2 ", buttonHtml)
    $("#page-header-btn-list").append(buttonHtml);
  
  }