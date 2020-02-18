export declare class Option {
    value: string;
    label: string;
    color: string;
    disabled: boolean;
    highlighted: boolean;
    selected: boolean;
    shown: boolean;
    inactive: boolean;
    constructor(value: string, label: string, color?: string);
    show(): void;
    hide(): void;
    disable(): void;
    enable(): void;
    undecoratedCopy(): {
        label: string;
        value: string;
    };
}
