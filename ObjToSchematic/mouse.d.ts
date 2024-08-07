export declare class MouseManager {
    private _gl;
    private static readonly MOUSE_LEFT;
    private static readonly MOUSE_RIGHT;
    private prevMouse;
    private currMouse;
    private static _instance;
    static get Get(): MouseManager;
    private constructor();
    init(): void;
    onMouseMove(e: MouseEvent): void;
    isMouseLeftDown(): void;
    isMouseRightDown(): void;
    getMouseDelta(): {
        dx: number;
        dy: number;
    };
    getMousePosNorm(): {
        x: number;
        y: number;
    };
}
