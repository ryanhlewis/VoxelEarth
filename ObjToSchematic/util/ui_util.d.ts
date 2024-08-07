export type TStyleParams = {
    isHovered: boolean;
    isEnabled: boolean;
    isActive: boolean;
};
export declare namespace UIUtil {
    function getElementById(id: string): HTMLElement;
    function clearStyles(element: HTMLElement): void;
    function updateStyles(element: HTMLElement, style: TStyleParams): void;
}
