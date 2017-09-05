import {Option} from './option';
import {Diacritics} from './diacritics';

export class OptionList {

    private _options: Array<Option>;
    private _optionsListValueKey: string;
    private _optionsListLabelKey: string;
    private _maxDisplayedOptions: number;

    /* Consider using these for performance improvement. */
    // private _selection: Array<Option>;
    // private _filtered: Array<Option>;
    // private _value: Array<string>;

    private _highlightedOption: Option = null;
    private _hasShown: boolean;
    private _hasMaxDisplayedOptions: boolean;

    constructor(options: Array<any>, optionsListValueKey: string, optionsListLabelKey: string, maxDisplayedOptions: number) {
        this._optionsListValueKey = optionsListValueKey;
        this._optionsListLabelKey = optionsListLabelKey;
        this._maxDisplayedOptions = maxDisplayedOptions;

        if (typeof options === 'undefined' || options === null) {
            options = [];
        }

        this._options = options.map((option) => {
            // Convert the value to string to match the default HTML select behaviour
            let o: Option = new Option(String(option[this._optionsListValueKey]), option[this._optionsListLabelKey]);
            if (option.disabled) {
                o.disable();
            }
            return o;
        });

        this._hasShown = this._options.length > 0;
        this.highlight();
    }

    /** Options. **/

    get options(): Array<Option> {
        return this._options;
    }

    getOptionsByValue(value: string): Array<Option> {
        return this.options.filter((option) => {
            return option.value === value;
        });
    }

    /**
     * Create a new option at the end of the options list for a fallback option
     * @param {string} label The label to be displayed
     * @param {string} value The value of the option
     */
    pushFallbackOption(label: string, value: string) {
        // Convert the value to string to match the default HTML select behaviour
        let o: Option = new Option(value, label);
        o.inactive = true;

        this._options.push(o);
    }

    /** Value. **/

    get value(): Array<string> {
        return this.selection.map((selectedOption) => {
            return selectedOption.value;
        });
    }

    /**
     * Marks the options that match the given value as selected
     * @param v The items to be selected
     * @returns {boolean} True if at least one item has been selected
     */
    setValue(v: Array<string>) {
        let oneItemsHasBeenSelected = false;
        v = typeof v === 'undefined' || v === null ? [] : v;

        this.options.forEach((option) => {
            option.selected = v.indexOf(option.value) > -1;
            oneItemsHasBeenSelected = oneItemsHasBeenSelected || option.selected;
        });

        return oneItemsHasBeenSelected;
    }

    /**
     * @deprecated
     * @param v
     */
    set value(v: Array<string>) {
        v = typeof v === 'undefined' || v === null ? [] : v;

        this.options.forEach((option) => {
            option.selected = v.indexOf(option.value) > -1;
        });
    }

    /** Selection. **/

    get selection(): Array<Option> {
        return this.options.filter((option) => {
            return option.selected;
        });
    }

    select(option: Option, multiple: boolean) {
        if (!multiple) {
            this.clearSelection();
        }
        option.selected = true;
    }

    deselect(option: Option) {
        option.selected = false;
    }

    clearSelection() {
        this.options.forEach((option) => {
            option.selected = false;
        });
    }

    /** Filter. **/

    get filtered(): Array<Option> {
        let visibleItems = this.options.filter((option) => {
            return option.shown;
        });

        if (visibleItems.length > this._maxDisplayedOptions) {
            visibleItems = visibleItems.slice(0, this._maxDisplayedOptions);
            this._hasMaxDisplayedOptions = true;
        } else {
            this._hasMaxDisplayedOptions = false;
        }

        return visibleItems;
    }

    filter(term: string): boolean {
        let anyShown: boolean = false;

        if (term.trim() === '') {
            this.resetFilter();
            anyShown = this.options.length > 0;
        }
        else {
            this.options.forEach((option) => {
                let l: string = Diacritics.strip(option.label).toUpperCase();
                let t: string = Diacritics.strip(term).toUpperCase();
                option.shown = l.indexOf(t) > -1;

                if (option.shown) {
                    anyShown = true;
                }
            });

        }
        let toEmpty: boolean = this.hasShown && !anyShown;

        this.highlight();
        this._hasShown = anyShown;

        return toEmpty;
    }

    private resetFilter() {
        this.options.forEach((option) => {
            option.shown = true;
        });
    }

    /** Highlight. **/

    get highlightedOption(): Option {
        return this._highlightedOption;
    }

    highlight() {
        let option: Option = this.hasShownSelected() ?
            this.getFirstShownSelected() : this.getFirstShown();
        this.highlightOption(option);
    }

    highlightOption(option: Option) {
        this.clearHighlightedOption();

        if (option !== null) {
            option.highlighted = true;
            this._highlightedOption = option;
        }
    }

    highlightNextOption() {
        let shownOptions = this.filtered;
        let index = this.getHighlightedIndexFromList(shownOptions);

        if (index > -1 && index < shownOptions.length - 1) {
            this.highlightOption(shownOptions[index + 1]);
        }
    }

    highlightPreviousOption() {
        let shownOptions = this.filtered;
        let index = this.getHighlightedIndexFromList(shownOptions);

        if (index > 0) {
            this.highlightOption(shownOptions[index - 1]);
        }
    }

    private clearHighlightedOption() {
        if (this.highlightedOption !== null) {
            this.highlightedOption.highlighted = false;
            this._highlightedOption = null;
        }
    }

    private getHighlightedIndexFromList(options: Array<Option>) {
        for (let i = 0; i < options.length; i++) {
            if (options[i].highlighted) {
                return i;
            }
        }
        return -1;
    }

    getHighlightedIndex() {
        return this.getHighlightedIndexFromList(this.filtered);
    }

    /** Util. **/

    get hasShown(): boolean {
        return this._hasShown;
    }

    /**
     * Returns true if the list contains displays more items than _hasMaxDisplayedOptions
     * @returns {boolean}
     */
    get hasMaxDisplayedOptions(): boolean {
        return this._hasMaxDisplayedOptions;
    }

    hasSelected() {
        return this.options.some((option) => {
            return option.selected;
        });
    }

    hasShownSelected() {
        return this.options.some((option) => {
            return option.shown && option.selected;
        });
    }

    private getFirstShown(): Option {
        for (let option of this.options) {
            if (option.shown) {
                return option;
            }
        }
        return null;
    }

    private getFirstShownSelected(): Option {
        for (let option of this.options) {
            if (option.shown && option.selected) {
                return option;
            }
        }
        return null;
    }

    // v0 and v1 are assumed not to be undefined or null.
    static equalValues(v0: Array<string>, v1: Array<string>): boolean {

        if (v0.length !== v1.length) {
            return false;
        }

        let a: Array<string> = v0.slice().sort();
        let b: Array<string> = v1.slice().sort();

        return a.every((v, i) => {
            return v === b[i];
        });
    }
}
