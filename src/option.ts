export class Option {
    value: string;
    label: string;
    color: string;

    disabled: boolean;
    highlighted: boolean;
    selected: boolean;
    shown: boolean;
    inactive: boolean;

    constructor(value: string, label: string, color = '#eeeeee') {
        this.value = value;
        this.label = label;
        this.color = color;

        this.disabled = false;
        this.highlighted = false;
        this.selected = false;
        this.shown = true;
    }

    show() {
        this.shown = true;
    }

    hide() {
        this.shown = false;
    }

    disable() {
        this.disabled = true;
    }

    enable() {
        this.disabled = false;
    }

    undecoratedCopy() {
        return {
            label: this.label,
            value: this.value
        };
    }
}
