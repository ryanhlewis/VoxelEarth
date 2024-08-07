"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var app_context_1 = require("./app_context");
app_context_1.AppContext.init();
// Begin draw loop
function render() {
    app_context_1.AppContext.draw();
    requestAnimationFrame(render);
}
requestAnimationFrame(render);
//# sourceMappingURL=main.js.map