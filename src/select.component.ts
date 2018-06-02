import {
    AfterViewInit,
    Component,
    Input,
    OnChanges,
    OnInit,
    Output,
    EventEmitter,
    ExistingProvider,
    ViewChild,
    ViewEncapsulation,
    forwardRef
} from '@angular/core';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {STYLE} from './select.component.css';
import {TEMPLATE} from './select.component.html';
import {SelectDropdownComponent} from './select-dropdown.component';
import {Option} from './option';
import {OptionList} from './option-list';
import {noop} from 'rxjs/util/noop';

export const SELECT_VALUE_ACCESSOR: ExistingProvider = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectComponent),
    multi: true
};

@Component({
    selector: 'ng-select-custom',
    template: TEMPLATE,
    styles: [STYLE],
    providers: [SELECT_VALUE_ACCESSOR],
    encapsulation: ViewEncapsulation.None
})

export class SelectComponent implements AfterViewInit, ControlValueAccessor, OnChanges, OnInit {

    @Input() options: Array<any>;

    @Input() allowClear: boolean = false;
    @Input() disabled: boolean = false;
    @Input() highlightColor: string;
    @Input() highlightTextColor: string;
    @Input() multiple: boolean = false;
    @Input() noFilter: number = 0;
    @Input() notFoundMsg: string = 'No results found';
    @Input() placeholder: string = '';
    @Input() maxDisplayedOptions: number;
    @Input() maxDisplayedOptionsMessage: string = 'Please filter the results';
    @Input() optionsListValueKey: string = 'value';
    @Input() optionsListLabelKey: string = 'label';
    @Input() optionsListColorKey: string = 'color';
    @Input() customColoredTags: boolean = false;
    /**
     * If true, the component emits the value changed event immediately after setting it even if the options are not loaded.
     * This feature enables loading the data for linked components (e.g. address: country->county->city->street)
     * @type {boolean}
     */
    @Input() notifyChangeBeforeOptionsLoaded: boolean = false;
    @Input() fetchFallbackOption: any;

    @Output() opened: EventEmitter<null> = new EventEmitter<null>();
    @Output() closed: EventEmitter<null> = new EventEmitter<null>();
    @Output() selected: EventEmitter<any> = new EventEmitter<any>();
    @Output() deselected: EventEmitter<any> = new EventEmitter<any>();
    @Output() noOptionsFound: EventEmitter<null> = new EventEmitter<null>();

    @ViewChild('selection') selectionSpan: any;
    @ViewChild('dropdown') dropdown: SelectDropdownComponent;
    @ViewChild('filterInput') filterInput: any;

    private _value: Array<any> = [];
    optionList: OptionList;

    // Selection state variables.
    hasSelected: boolean = false;

    // View state variables.
    filterEnabled: boolean = true;
    filterInputWidth: number = 1;
    hasFocus: boolean = false;
    isBelow: boolean = true;
    isDisabled: boolean = false;
    isOpen: boolean = false;
    placeholderView: string = '';
    keepValueUntilFirstOptionsAreSet = true;
    _internalValue: any;

    clearClicked: boolean = false;
    selectContainerClicked: boolean = false;

    // Width and position for the dropdown container.
    width: number;
    top: number;
    left: number;

    private onChange;
    private onTouched;

    /** Event handlers. **/

    constructor(private _sanitizer: DomSanitizer) {}

    // Angular lifecycle hooks.

    ngOnInit() {
        this.placeholderView = this.placeholder;
    }

    ngAfterViewInit() {
        this.updateFilterWidth();
    }

    ngOnChanges(changes: any) {
        if (changes.hasOwnProperty('options')) {
            this.updateOptionsList(changes['options'].isFirstChange());

            if (this.keepValueUntilFirstOptionsAreSet
                && (changes['options'].isFirstChange() || !changes['options'].previousValue)
                && !!changes['options'].currentValue) {
                // allow changing the value if the current value is set and the previous is not set or is first change (first change holds an empty object as the previous value)
                this.keepValueUntilFirstOptionsAreSet = false;

                if (this._internalValue && this._internalValue.length) {
                    // at the beginning, the component does not have any selection ( _internalValue = [] )
                    // do not emit value changed for undefined values
                    if (!this.optionList.setValue(this._internalValue)) {
                        // the value does not exists in the options list
                        // try to load fallback
                        this.loadFallbackOption(this._internalValue);
                    }

                    if (!this.notifyChangeBeforeOptionsLoaded) {
                        // if the value changed has not triggered when setting the internal model, do it now
                        this.valueChanged();
                    }
                }
            }
        }
        if (changes.hasOwnProperty('noFilter')) {
            let numOptions: number = this.optionList.options.length;
            let minNumOptions: number = changes['noFilter'].currentValue;
            this.filterEnabled = numOptions >= minNumOptions;
        }
    }

    // Window.

    onWindowClick() {
        if (!this.selectContainerClicked) {
            this.closeDropdown();
        }
        this.clearClicked = false;
        this.selectContainerClicked = false;
    }

    onWindowResize() {
        this.updateWidth();
    }

    // Select container.

    onSelectContainerClick() {
        this.selectContainerClicked = true;
        if (!this.clearClicked) {
            this.toggleDropdown();
        }
    }

    onSelectContainerFocus() {
        this.onTouched && this.onTouched();
    }

    onSelectContainerKeydown(event: any) {
        this.handleSelectContainerKeydown(event);
    }

    // Dropdown container.

    onDropdownOptionClicked(option: Option) {
        this.multiple ? this.toggleSelectOption(option) : this.selectOption(option);
    }

    onDropdownClose(focus: any) {
        this.closeDropdown(focus);
    }

    // Single filter input.

    onSingleFilterClick() {
        this.selectContainerClicked = true;
    }

    onSingleFilterInput(term: string) {
        let toEmpty: boolean = this.optionList.filter(term);
        if (toEmpty) {
            this.noOptionsFound.emit(null);
        }
    }

    onSingleFilterKeydown(event: any) {
        this.handleSingleFilterKeydown(event);
    }

    // Multiple filter input.

    onMultipleFilterInput(event: any) {
        if (!this.isOpen) {
            this.openDropdown();
        }
        this.updateFilterWidth();
        setTimeout(() => {
            let toEmpty: boolean = this.optionList.filter(event.target.value);
            if (toEmpty) {
                this.noOptionsFound.emit(null);
            }
        });
    }

    onMultipleFilterKeydown(event: any) {
        this.handleMultipleFilterKeydown(event);
    }

    // Single clear select.

    onClearSelectionClick() {
        this.clearClicked = true;
        this.clearSelection();
        this.closeDropdown(true);
    }

    // Multiple deselect option.

    onDeselectOptionClick(option: Option) {
        this.clearClicked = true;
        this.deselectOption(option);
    }

    /** API. **/

    // TODO fix issues with global click/key handler that closes the dropdown.
    open() {
        this.openDropdown();
    }

    close() {
        this.closeDropdown();
    }

    clear() {
        this.clearSelection();
    }

    select(value: string) {
        this.optionList.getOptionsByValue(value).forEach((option) => {
            this.selectOption(option);
        });
    }

    /** ControlValueAccessor interface methods. **/

    writeValue(value: any) {
        this.value = value;
    }

    registerOnChange(fn: (_: any) => void) {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void) {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean) {
        this.disabled = isDisabled;
    }

    /** Value. **/

    get value(): any {
        // retrieve the internal value until the options are loaded
        if (this.keepValueUntilFirstOptionsAreSet) {
            return this.multiple ? this._internalValue : this._internalValue[0];
        }

        return this.multiple ? this._value : this._value[0];
    }

    set value(v: any) {
        if (typeof v === 'undefined' || v === null || v === '') {
            v = [];
        }
        else if (typeof v === 'string') {
            v = [v];
        } else if (typeof v === 'number') {
            v = [String(v)];
        }
        else if (!Array.isArray(v)) {
            throw new TypeError('Value must be a string or an array.');
        }

        // capture the internal model until the options are loaded
        // don't emit a value changed event
        if (this.keepValueUntilFirstOptionsAreSet) {
            this._internalValue = v;

            if (this.notifyChangeBeforeOptionsLoaded) {
                this.valueChanged();
            }
            return;
        }

        if (!OptionList.equalValues(v, this._value)) {
            // The new value is different from the old one
            if (!this.optionList.setValue(v)) {
                // the value does not exists in the options list
                // try to load fallback
                this.loadFallbackOption(v);
            }
            this.valueChanged();
        }
    }

    private valueChanged() {
        this._value = this.optionList.value;

        this.hasSelected = this._value.length > 0;
        this.placeholderView = this.hasSelected ? '' : this.placeholder;
        this.updateFilterWidth();

        this.onChange && this.onChange(this.value);
    }

    /** Initialization. **/

    private updateOptionsList(firstTime: boolean) {
        let v: Array<string>;

        if (!firstTime && !this.keepValueUntilFirstOptionsAreSet) {
            // preserve the selected value on second+ run
            v = this.optionList.value;
        }

        this.optionList = new OptionList(this.options, this.optionsListValueKey, this.optionsListLabelKey, this.maxDisplayedOptions, this.optionsListColorKey);

        if (!firstTime && !this.keepValueUntilFirstOptionsAreSet) {
            if (!this.optionList.setValue(v)) {
                this.loadFallbackOption(v);
            }

            if (!OptionList.equalValues(this.optionList.value, v)) {
                // emit value changed only if the new options does not contain the old values
                this.valueChanged();
            }
        }
    }

    /**
     * The given value is not present in the options list.
     * Try to get it from the fallback option
     * @param v The value that was not found
     */
    private loadFallbackOption(v: Array<string>) {
        if (!this.fetchFallbackOption || !v || !v.length) {
            // fall back function has not been set
            // OR value has not been given
            return;
        }

        Promise.resolve(this.fetchFallbackOption(v[0]))
            .then(label => {
                if (label) {
                    // push this option to the options list
                    this.optionList.pushFallbackOption(label, v[0]);
                    this.optionList.setValue(v);
                    this.valueChanged();
                }
            })
            .catch(noop);
    }

    /** Dropdown. **/

    private toggleDropdown() {
        if (!this.isDisabled) {
            this.isOpen ? this.closeDropdown(true) : this.openDropdown();
        }
    }

    private openDropdown() {
        if (!this.isOpen) {
            this.updateWidth();
            this.updatePosition();
            this.isOpen = true;
            if (this.multiple && this.filterEnabled) {
                this.filterInput.nativeElement.focus();
            }
            this.opened.emit(null);
        }
    }

    private closeDropdown(focus: boolean = false) {
        if (this.isOpen) {
            this.clearFilterInput();
            this.isOpen = false;
            if (focus) {
                this.focus();
            }
            this.closed.emit(null);
        }
    }

    /** Select. **/

    private selectOption(option: Option) {
        if (!option.selected) {
            this.optionList.select(option, this.multiple);
            this.valueChanged();
            this.selected.emit(option.undecoratedCopy());
        }
    }

    private deselectOption(option: Option) {
        if (option.selected) {
            this.optionList.deselect(option);
            this.valueChanged();
            this.deselected.emit(option.undecoratedCopy());
            setTimeout(() => {
                if (this.multiple) {
                    this.updatePosition();
                    this.optionList.highlight();
                    if (this.isOpen) {
                        this.dropdown.moveHighlightedIntoView();
                    }
                }
            });
        }
    }

    private clearSelection() {
        let selection: Array<Option> = this.optionList.selection;
        if (selection.length > 0) {
            this.optionList.clearSelection();
            this.valueChanged();

            if (selection.length === 1) {
                this.deselected.emit(selection[0].undecoratedCopy());
            }
            else {
                this.deselected.emit(selection.map((option) => {
                    return option.undecoratedCopy();
                }));
            }
        }
    }

    private toggleSelectOption(option: Option) {
        option.selected ?
            this.deselectOption(option) : this.selectOption(option);
    }

    private selectHighlightedOption() {
        let option: Option = this.optionList.highlightedOption;
        if (option !== null) {
            this.selectOption(option);
            this.closeDropdown(true);
        }
    }

    private deselectLast() {
        let sel: Array<Option> = this.optionList.selection;

        if (sel.length > 0) {
            let option: Option = sel[sel.length - 1];
            this.deselectOption(option);
            this.setMultipleFilterInput(option.label + ' ');
        }
    }

    /** Filter. **/

    private clearFilterInput() {
        if (this.multiple && this.filterEnabled) {
            this.filterInput.nativeElement.value = '';
        }
        else {
            this.dropdown.clearFilterInput();
        }
    }

    private setMultipleFilterInput(value: string) {
        if (this.filterEnabled) {
            this.filterInput.nativeElement.value = value;
        }
    }

    /** Keys. **/

    private KEYS: any = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        UP: 38,
        DOWN: 40
    };

    private handleSelectContainerKeydown(event: any) {
        let key = event.which;

        if (this.isOpen) {
            if (key === this.KEYS.ESC ||
                (key === this.KEYS.UP && event.altKey)) {
                this.closeDropdown(true);
            }
            else if (key === this.KEYS.TAB) {
                this.closeDropdown();
            }
            else if (key === this.KEYS.ENTER) {
                this.selectHighlightedOption();
            }
            else if (key === this.KEYS.UP) {
                this.optionList.highlightPreviousOption();
                this.dropdown.moveHighlightedIntoView();
                if (!this.filterEnabled) {
                    event.preventDefault();
                }
            }
            else if (key === this.KEYS.DOWN) {
                this.optionList.highlightNextOption();
                this.dropdown.moveHighlightedIntoView();
                if (!this.filterEnabled) {
                    event.preventDefault();
                }
            }
        }
        else {
            if (key === this.KEYS.ENTER || key === this.KEYS.SPACE ||
                (key === this.KEYS.DOWN && event.altKey)) {

                /* FIREFOX HACK:
                 *
                 * The setTimeout is added to prevent the enter keydown event
                 * to be triggered for the filter input field, which causes
                 * the dropdown to be closed again.
                 */
                setTimeout(() => {
                    this.openDropdown();
                });
            }
        }

    }

    private handleMultipleFilterKeydown(event: any) {
        let key = event.which;

        if (key === this.KEYS.BACKSPACE) {
            if (this.hasSelected && this.filterEnabled &&
                this.filterInput.nativeElement.value === '') {
                this.deselectLast();
            }
        }
    }

    private handleSingleFilterKeydown(event: any) {
        let key = event.which;

        if (key === this.KEYS.ESC || key === this.KEYS.TAB
            || key === this.KEYS.UP || key === this.KEYS.DOWN
            || key === this.KEYS.ENTER) {
            this.handleSelectContainerKeydown(event);
        }
    }

    /** View. **/

    focus() {
        this.hasFocus = true;
        if (this.multiple && this.filterEnabled) {
            this.filterInput.nativeElement.focus();
        }
        else {
            this.selectionSpan.nativeElement.focus();
        }
    }

    blur() {
        this.hasFocus = false;
        this.selectionSpan.nativeElement.blur();
    }

    updateWidth() {
        this.width = this.selectionSpan.nativeElement.offsetWidth;
    }

    updatePosition() {
        let e = this.selectionSpan.nativeElement;
        this.left = e.offsetLeft;
        this.top = e.offsetTop + e.offsetHeight;
    }

    updateFilterWidth() {
        if (typeof this.filterInput !== 'undefined') {
            let value: string = this.filterInput.nativeElement.value;
            this.filterInputWidth = value.length === 0 ?
                1 + this.placeholderView.length * 10 : 1 + value.length * 10;
        }
    }

    pickTextColorBasedOnBgColor(bgColor, lightColor = '#ffffff', darkColor = '#000000') {
        if (!bgColor) {
          return darkColor;
        }
        const color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
        const r = parseInt(color.substring(0, 2), 16); // hexToR
        const g = parseInt(color.substring(2, 4), 16); // hexToG
        const b = parseInt(color.substring(4, 6), 16); // hexToB
        const uicolors = [r / 255, g / 255, b / 255];
        const c = uicolors.map((col) => {
          if (col <= 0.03928) {
            return col / 12.92;
          }
          return Math.pow((col + 0.055) / 1.055, 2.4);
        });
        const L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
        return (L > 0.179) ? darkColor : lightColor;
      }

      getStyleForMultipleTags(option): SafeStyle {
          if (this.customColoredTags && option) {
              return this._sanitizer.bypassSecurityTrustStyle(`background-color: ${option.color}; color: ${this.pickTextColorBasedOnBgColor(option.color)} !important`);
          }
          return null;
      }
}
