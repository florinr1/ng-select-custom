import { Option } from './option';
export declare class OptionList {
    private _options;
    private _optionsListValueKey;
    private _optionsListLabelKey;
    private _maxDisplayedOptions;
    private _highlightedOption;
    private _hasShown;
    private _hasMaxDisplayedOptions;
    constructor(options: Array<any>, optionsListValueKey: string, optionsListLabelKey: string, maxDisplayedOptions: number);
    /** Options. **/
    readonly options: Array<Option>;
    getOptionsByValue(value: string): Array<Option>;
    /** Value. **/
    value: Array<string>;
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
