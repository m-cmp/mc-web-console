require("expose-loader?exposes=$,jQuery!jquery");
const bootstrap = require("bootstrap/dist/js/bootstrap.bundle.js");
window.bootstrap = bootstrap;
require("@fortawesome/fontawesome-free/js/all.js");
require("jquery-ujs/src/rails.js");