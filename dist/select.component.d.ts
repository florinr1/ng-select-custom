import { AfterViewInit, OnChanges, OnInit, EventEmitter, ExistingProvider } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { SelectDropdownComponent } from './select-dropdown.component';
import { Option } from './option';
import { OptionList } from './option-list';
export declare const SELECT_VALUE_ACCESSOR: ExistingProvider;
export declare class SelectComponent implements AfterViewInit, ControlValueAccessor, OnChanges, OnInit {
    options: Array<any>;
    allowClear: boolean;
    disabled: boolean;
    highlightColor: string;
    highlightTextColor: string;
    multiple: boolean;
    noFilter: number;
    notFoundMsg: string;
    placeholder: string;
    maxDisplayedOptions: number;
    maxDisplayedOptionsMessage: string;
    optionsListValueKey: string;
    optionsListLabelKey: string;
    optionsListColorKey: string;
    customColoredTags: boolean;
    /**
     * If true, the component emits the value changed event immediately after setting it even if the options are not loaded.
     * This feature enables loading the data for linked components (e.g. address: country->county->city->street)
     * @type {boolean}
     */
    notifyChangeBeforeOptionsLoaded: boolean;
    fetchFallbackOption: any;
    opened: EventEmitter<null>;
    closed: EventEmitter<null>;
    selected: EventEmitter<any>;
    deselected: EventEmitter<any>;
    noOptionsFound: EventEmitter<null>;
    selectionSpan: any;
    dropdown: SelectDropdownComponent;
    filterInput: any;
    private _value;
    optionList: OptionList;
    hasSelected: boolean;
    filterEnabled: boolean;
    filterInputWidth: number;
    hasFocus: boolean;
    isBelow: boolean;
    isDisabled: boolean;
    isOpen: boolean;
    placeholderView: string;
    keepValueUntilFirstOptionsAreSet: boolean;
    _internalValue: any;
    clearClicked: boolean;
    selectContainerClicked: boolean;
    width: number;
    top: number;
    left: number;
    private onChange;
    private onTouched;
    /** Event handlers. **/
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnChanges(changes: any): void;
    onWindowClick(): void;
    onWindowResize(): void;
    onSelectContainerClick(): void;
    onSelectContainerFocus(): void;
    onSelectContainerKeydown(event: any): void;
    onDropdownOptionClicked(option: Option): void;
    onDropdownClose(focus: any): void;
    onSingleFilterClick(): void;
    onSingleFilterInput(term: string): void;
    onSingleFilterKeydown(event: any): void;
    onMultipleFilterInput(event: any): void;
    onMultipleFilterKeydown(event: any): void;
    onClearSelectionClick(): void;
    onDeselectOptionClick(option: Option): void;
    /** API. **/
    open(): void;
    close(): void;
    clear(): void;
    select(value: string): void;
    /** ControlValueAccessor interface methods. **/
    writeValue(value: any): void;
    registerOnChange(fn: (_: any) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    /** Value. **/
    value: any;
    private valueChanged();
    /** Initialization. **/
    private updateOptionsList(firstTime);
    /**
     * The given value is not present in the options list.
     * Try to get it from the fallback option
     * @param v The value that was not found
     */
    private loadFallbackOption(v);
    /** Dropdown. **/
    private toggleDropdown();
    private openDropdown();
    private closeDropdown(focus?);
    /** Select. **/
    private selectOption(option);
    private deselectOption(option);
    private clearSelection();
    private toggleSelectOption(option);
    private selectHighlightedOption();
    private deselectLast();
    /** Filter. **/
    private clearFilterInput();
    private setMultipleFilterInput(value);
    /** Keys. **/
    private KEYS;
    private handleSelectContainerKeydown(event);
    private handleMultipleFilterKeydown(event);
    private handleSingleFilterKeydown(event);
    /** View. **/
    focus(): void;
    blur(): void;
    updateWidth(): void;
    updatePosition(): void;
    updateFilterWidth(): void;
    pickTextColorBasedOnBgColor(bgColor: any, lightColor?: string, darkColor?: string): string;
}
