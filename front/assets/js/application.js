require("expose-loader?exposes=$,jQuery!jquery");
const bootstrap = require("bootstrap/dist/js/bootstrap.bundle.js");
window.bootstrap = bootstrap;
require("@fortawesome/fontawesome-free/js/all.js");
require("jquery-ujs/src/rails.js");
require("~jquery/dist/jquery.js");
require("jstree/disk/themes/default/style.css");
// jstree 오버라이드: 테마 직후 로드해 flex/행높이 등 우리 스타일이 적용되도록 함
require("../css/jstree_for_tabler.scss");