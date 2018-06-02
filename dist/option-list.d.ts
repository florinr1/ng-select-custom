import { Option } from './option';
export declare class OptionList {
    private _options;
    private _optionsListValueKey;
    private _optionsListLabelKey;
    private _maxDisplayedOptions;
    private _optionsListColorKey;
    private _highlightedOption;
    private _hasShown;
    private _hasMaxDisplayedOptions;
    constructor(options: Array<any>, optionsListValueKey: string, optionsListLabelKey: string, maxDisplayedOptions: number, optionsListColorKey?: string);
    /** Options. **/
    readonly options: Array<Option>;
    getOptionsByValue(value: string): Array<Option>;
    /**
     * Create a new option at the end of the options list for a fallback option
     * @param {string} label The label to be displayed
     * @param {string} value The value of the option
     */
    pushFallbackOption(label: string, value: string): void;
    /** Value. **/
    /**
     * @deprecated
     * @param v
     */
    value: Array<string>;
    /**
     * Marks the options that match the given value as selected
     * @param v The items to be selected
     * @returns {boolean} True if at least one item has been selected
     */
    setValue(v: Array<string>): boolean;
    /** Selection. **/
    readonly selection: Array<Option>;
    select(option: Option, multiple: boolean): void;
    deselect(option: Option): void;
    clearSelection(): void;
    /** Filter. **/
    readonly filtered: Array<Option>;
    filter(term: string): boolean;
    private resetFilter();
    /** Highlight. **/
    readonly highlightedOption: Option;
    highlight(): void;
    highlightOption(option: Option): void;
    highlightNextOption(): void;
    highlightPreviousOption(): void;
    private clearHighlightedOption();
    private getHighlightedIndexFromList(options);
    getHighlightedIndex(): number;
    /** Util. **/
    readonly hasShown: boolean;
    /**
     * Returns true if the list contains displays more items than _hasMaxDisplayedOptions
     * @returns {boolean}
     */
    readonly hasMaxDisplayedOptions: boolean;
    hasSelected(): boolean;
    hasShownSelected(): boolean;
    private getFirstShown();
    private getFirstShownSelected();
    static equalValues(v0: Array<string>, v1: Array<string>): boolean;
}
