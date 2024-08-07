"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MouseManager = void 0;
var renderer_1 = require("./renderer");
var MouseManager = /** @class */ (function () {
    function MouseManager(gl) {
        this._gl = gl;
        this.currMouse = { x: -1, y: -1, buttons: 0 };
        this.prevMouse = { x: -1, y: -1, buttons: 0 };
    }
    Object.defineProperty(MouseManager, "Get", {
        get: function () {
            return this._instance || (this._instance = new this(renderer_1.Renderer.Get._gl));
        },
        enumerable: false,
        configurable: true
    });
    MouseManager.prototype.init = function () {
        var _this = this;
        document.addEventListener('mousemove', function (e) {
            _this.onMouseMove(e);
        });
    };
    MouseManager.prototype.onMouseMove = function (e) {
        this.currMouse = { x: e.clientX, y: e.clientY, buttons: e.buttons };
    };
    MouseManager.prototype.isMouseLeftDown = function () {
        this.currMouse.buttons & MouseManager.MOUSE_LEFT;
    };
    MouseManager.prototype.isMouseRightDown = function () {
        this.currMouse.buttons & MouseManager.MOUSE_RIGHT;
    };
    MouseManager.prototype.getMouseDelta = function () {
        var delta = {
            dx: this.currMouse.x - this.prevMouse.x,
            dy: -(this.currMouse.y - this.prevMouse.y),
        };
        this.prevMouse = this.currMouse;
        return delta;
    };
    ;
    MouseManager.prototype.getMousePosNorm = function () {
        var normX = 2 * (this.currMouse.x / this._gl.canvas.width) - 1;
        var normY = -(2 * (this.currMouse.y / this._gl.canvas.height) - 1);
        return { x: normX, y: normY };
    };
    MouseManager.MOUSE_LEFT = 1;
    MouseManager.MOUSE_RIGHT = 2;
    return MouseManager;
}());
exports.MouseManager = MouseManager;
//# sourceMappingURL=mouse.js.map