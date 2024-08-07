"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MouseManager = void 0;
const renderer_1 = require("./renderer");
class MouseManager {
    static get Get() {
        return this._instance || (this._instance = new this(renderer_1.Renderer.Get._gl));
    }
    constructor(gl) {
        this._gl = gl;
        this.currMouse = { x: -1, y: -1, buttons: 0 };
        this.prevMouse = { x: -1, y: -1, buttons: 0 };
    }
    init() {
        document.addEventListener('mousemove', (e) => {
            this.onMouseMove(e);
        });
    }
    onMouseMove(e) {
        this.currMouse = { x: e.clientX, y: e.clientY, buttons: e.buttons };
    }
    isMouseLeftDown() {
        this.currMouse.buttons & MouseManager.MOUSE_LEFT;
    }
    isMouseRightDown() {
        this.currMouse.buttons & MouseManager.MOUSE_RIGHT;
    }
    getMouseDelta() {
        const delta = {
            dx: this.currMouse.x - this.prevMouse.x,
            dy: -(this.currMouse.y - this.prevMouse.y),
        };
        this.prevMouse = this.currMouse;
        return delta;
    }
    ;
    getMousePosNorm() {
        const normX = 2 * (this.currMouse.x / this._gl.canvas.width) - 1;
        const normY = -(2 * (this.currMouse.y / this._gl.canvas.height) - 1);
        return { x: normX, y: normY };
    }
}
exports.MouseManager = MouseManager;
MouseManager.MOUSE_LEFT = 1;
MouseManager.MOUSE_RIGHT = 2;
