import { ConfigComponent } from './config';
/**
 * A `FullConfigComponent` is a UI element that has a value the user can change.
 * For example, sliders, comboboxes and checkboxes are `ConfigComponent`.
 */
export declare abstract class FullConfigComponent<T, F> extends ConfigComponent<T, F> {
    generateHTML(): string;
}
