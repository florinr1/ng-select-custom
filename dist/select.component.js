"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var forms_1 = require("@angular/forms");
var select_component_css_1 = require("./select.component.css");
var select_component_html_1 = require("./select.component.html");
var option_list_1 = require("./option-list");
var noop_1 = require("rxjs/util/noop");
exports.SELECT_VALUE_ACCESSOR = {
    provide: forms_1.NG_VALUE_ACCESSOR,
    useExisting: core_1.forwardRef(function () { return SelectComponent; }),
    multi: true
};
var SelectComponent = (function () {
    function SelectComponent() {
        this.allowClear = false;
        this.disabled = false;
        this.multiple = false;
        this.noFilter = 0;
        this.notFoundMsg = 'No results found';
        this.placeholder = '';
        this.maxDisplayedOptionsMessage = 'Please filter the results';
        this.optionsListValueKey = 'value';
        this.optionsListLabelKey = 'label';
        this.optionsListColorKey = 'color';
        /**
         * If true, the component emits the value changed event immediately after setting it even if the options are not loaded.
         * This feature enables loading the data for linked components (e.g. address: country->county->city->street)
         * @type {boolean}
         */
        this.notifyChangeBeforeOptionsLoaded = false;
        this.opened = new core_1.EventEmitter();
        this.closed = new core_1.EventEmitter();
        this.selected = new core_1.EventEmitter();
        this.deselected = new core_1.EventEmitter();
        this.noOptionsFound = new core_1.EventEmitter();
        this._value = [];
        // Selection state variables.
        this.hasSelected = false;
        // View state variables.
        this.filterEnabled = true;
        this.filterInputWidth = 1;
        this.hasFocus = false;
        this.isBelow = true;
        this.isDisabled = false;
        this.isOpen = false;
        this.placeholderView = '';
        this.keepValueUntilFirstOptionsAreSet = true;
        this.clearClicked = false;
        this.selectContainerClicked = false;
        /** Keys. **/
        this.KEYS = {
            BACKSPACE: 8,
            TAB: 9,
            ENTER: 13,
            ESC: 27,
            SPACE: 32,
            UP: 38,
            DOWN: 40
        };
    }
    /** Event handlers. **/
    // Angular lifecycle hooks.
    SelectComponent.prototype.ngOnInit = function () {
        this.placeholderView = this.placeholder;
    };
    SelectComponent.prototype.ngAfterViewInit = function () {
        this.updateFilterWidth();
    };
    SelectComponent.prototype.ngOnChanges = function (changes) {
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
            var numOptions = this.optionList.options.length;
            var minNumOptions = changes['noFilter'].currentValue;
            this.filterEnabled = numOptions >= minNumOptions;
        }
    };
    // Window.
    SelectComponent.prototype.onWindowClick = function () {
        if (!this.selectContainerClicked) {
            this.closeDropdown();
        }
        this.clearClicked = false;
        this.selectContainerClicked = false;
    };
    SelectComponent.prototype.onWindowResize = function () {
        this.updateWidth();
    };
    // Select container.
    SelectComponent.prototype.onSelectContainerClick = function () {
        this.selectContainerClicked = true;
        if (!this.clearClicked) {
            this.toggleDropdown();
        }
    };
    SelectComponent.prototype.onSelectContainerFocus = function () {
        this.onTouched && this.onTouched();
    };
    SelectComponent.prototype.onSelectContainerKeydown = function (event) {
        this.handleSelectContainerKeydown(event);
    };
    // Dropdown container.
    SelectComponent.prototype.onDropdownOptionClicked = function (option) {
        this.multiple ? this.toggleSelectOption(option) : this.selectOption(option);
    };
    SelectComponent.prototype.onDropdownClose = function (focus) {
        this.closeDropdown(focus);
    };
    // Single filter input.
    SelectComponent.prototype.onSingleFilterClick = function () {
        this.selectContainerClicked = true;
    };
    SelectComponent.prototype.onSingleFilterInput = function (term) {
        var toEmpty = this.optionList.filter(term);
        if (toEmpty) {
            this.noOptionsFound.emit(null);
        }
    };
    SelectComponent.prototype.onSingleFilterKeydown = function (event) {
        this.handleSingleFilterKeydown(event);
    };
    // Multiple filter input.
    SelectComponent.prototype.onMultipleFilterInput = function (event) {
        var _this = this;
        if (!this.isOpen) {
            this.openDropdown();
        }
        this.updateFilterWidth();
        setTimeout(function () {
            var toEmpty = _this.optionList.filter(event.target.value);
            if (toEmpty) {
                _this.noOptionsFound.emit(null);
            }
        });
    };
    SelectComponent.prototype.onMultipleFilterKeydown = function (event) {
        this.handleMultipleFilterKeydown(event);
    };
    // Single clear select.
    SelectComponent.prototype.onClearSelectionClick = function () {
        this.clearClicked = true;
        this.clearSelection();
        this.closeDropdown(true);
    };
    // Multiple deselect option.
    SelectComponent.prototype.onDeselectOptionClick = function (option) {
        this.clearClicked = true;
        this.deselectOption(option);
    };
    /** API. **/
    // TODO fix issues with global click/key handler that closes the dropdown.
    SelectComponent.prototype.open = function () {
        this.openDropdown();
    };
    SelectComponent.prototype.close = function () {
        this.closeDropdown();
    };
    SelectComponent.prototype.clear = function () {
        this.clearSelection();
    };
    SelectComponent.prototype.select = function (value) {
        var _this = this;
        this.optionList.getOptionsByValue(value).forEach(function (option) {
            _this.selectOption(option);
        });
    };
    /** ControlValueAccessor interface methods. **/
    SelectComponent.prototype.writeValue = function (value) {
        this.value = value;
    };
    SelectComponent.prototype.registerOnChange = function (fn) {
        this.onChange = fn;
    };
    SelectComponent.prototype.registerOnTouched = function (fn) {
        this.onTouched = fn;
    };
    SelectComponent.prototype.setDisabledState = function (isDisabled) {
        this.disabled = isDisabled;
    };
    Object.defineProperty(SelectComponent.prototype, "value", {
        /** Value. **/
        get: function () {
            // retrieve the internal value until the options are loaded
            if (this.keepValueUntilFirstOptionsAreSet) {
                return this.multiple ? this._internalValue : this._internalValue[0];
            }
            return this.multiple ? this._value : this._value[0];
        },
        set: function (v) {
            if (typeof v === 'undefined' || v === null || v === '') {
                v = [];
            }
            else if (typeof v === 'string') {
                v = [v];
            }
            else if (typeof v === 'number') {
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
            if (!option_list_1.OptionList.equalValues(v, this._value)) {
                // The new value is different from the old one
                if (!this.optionList.setValue(v)) {
                    // the value does not exists in the options list
                    // try to load fallback
                    this.loadFallbackOption(v);
                }
                this.valueChanged();
            }
        },
        enumerable: true,
        configurable: true
    });
    SelectComponent.prototype.valueChanged = function () {
        this._value = this.optionList.value;
        this.hasSelected = this._value.length > 0;
        this.placeholderView = this.hasSelected ? '' : this.placeholder;
        this.updateFilterWidth();
        this.onChange && this.onChange(this.value);
    };
    /** Initialization. **/
    SelectComponent.prototype.updateOptionsList = function (firstTime) {
        var v;
        if (!firstTime && !this.keepValueUntilFirstOptionsAreSet) {
            // preserve the selected value on second+ run
            v = this.optionList.value;
        }
        this.optionList = new option_list_1.OptionList(this.options, this.optionsListValueKey, this.optionsListLabelKey, this.maxDisplayedOptions);
        if (!firstTime && !this.keepValueUntilFirstOptionsAreSet) {
            if (!this.optionList.setValue(v)) {
                this.loadFallbackOption(v);
            }
            if (!option_list_1.OptionList.equalValues(this.optionList.value, v)) {
                // emit value changed only if the new options does not contain the old values
                this.valueChanged();
            }
        }
    };
    /**
     * The given value is not present in the options list.
     * Try to get it from the fallback option
     * @param v The value that was not found
     */
    SelectComponent.prototype.loadFallbackOption = function (v) {
        var _this = this;
        if (!this.fetchFallbackOption || !v || !v.length) {
            // fall back function has not been set
            // OR value has not been given
            return;
        }
        Promise.resolve(this.fetchFallbackOption(v[0]))
            .then(function (label) {
            if (label) {
                // push this option to the options list
                _this.optionList.pushFallbackOption(label, v[0]);
                _this.optionList.setValue(v);
                _this.valueChanged();
            }
        })
            .catch(noop_1.noop);
    };
    /** Dropdown. **/
    SelectComponent.prototype.toggleDropdown = function () {
        if (!this.isDisabled) {
            this.isOpen ? this.closeDropdown(true) : this.openDropdown();
        }
    };
    SelectComponent.prototype.openDropdown = function () {
        if (!this.isOpen) {
            this.updateWidth();
            this.updatePosition();
            this.isOpen = true;
            if (this.multiple && this.filterEnabled) {
                this.filterInput.nativeElement.focus();
            }
            this.opened.emit(null);
        }
    };
    SelectComponent.prototype.closeDropdown = function (focus) {
        if (focus === void 0) { focus = false; }
        if (this.isOpen) {
            this.clearFilterInput();
            this.isOpen = false;
            if (focus) {
                this.focus();
            }
            this.closed.emit(null);
        }
    };
    /** Select. **/
    SelectComponent.prototype.selectOption = function (option) {
        if (!option.selected) {
            this.optionList.select(option, this.multiple);
            this.valueChanged();
            this.selected.emit(option.undecoratedCopy());
        }
    };
    SelectComponent.prototype.deselectOption = function (option) {
        var _this = this;
        if (option.selected) {
            this.optionList.deselect(option);
            this.valueChanged();
            this.deselected.emit(option.undecoratedCopy());
            setTimeout(function () {
                if (_this.multiple) {
                    _this.updatePosition();
                    _this.optionList.highlight();
                    if (_this.isOpen) {
                        _this.dropdown.moveHighlightedIntoView();
                    }
                }
            });
        }
    };
    SelectComponent.prototype.clearSelection = function () {
        var selection = this.optionList.selection;
        if (selection.length > 0) {
            this.optionList.clearSelection();
            this.valueChanged();
            if (selection.length === 1) {
                this.deselected.emit(selection[0].undecoratedCopy());
            }
            else {
                this.deselected.emit(selection.map(function (option) {
                    return option.undecoratedCopy();
                }));
            }
        }
    };
    SelectComponent.prototype.toggleSelectOption = function (option) {
        option.selected ?
            this.deselectOption(option) : this.selectOption(option);
    };
    SelectComponent.prototype.selectHighlightedOption = function () {
        var option = this.optionList.highlightedOption;
        if (option !== null) {
            this.selectOption(option);
            this.closeDropdown(true);
        }
    };
    SelectComponent.prototype.deselectLast = function () {
        var sel = this.optionList.selection;
        if (sel.length > 0) {
            var option = sel[sel.length - 1];
            this.deselectOption(option);
            this.setMultipleFilterInput(option.label + ' ');
        }
    };
    /** Filter. **/
    SelectComponent.prototype.clearFilterInput = function () {
        if (this.multiple && this.filterEnabled) {
            this.filterInput.nativeElement.value = '';
        }
        else {
            this.dropdown.clearFilterInput();
        }
    };
    SelectComponent.prototype.setMultipleFilterInput = function (value) {
        if (this.filterEnabled) {
            this.filterInput.nativeElement.value = value;
        }
    };
    SelectComponent.prototype.handleSelectContainerKeydown = function (event) {
        var _this = this;
        var key = event.which;
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
                setTimeout(function () {
                    _this.openDropdown();
                });
            }
        }
    };
    SelectComponent.prototype.handleMultipleFilterKeydown = function (event) {
        var key = event.which;
        if (key === this.KEYS.BACKSPACE) {
            if (this.hasSelected && this.filterEnabled &&
                this.filterInput.nativeElement.value === '') {
                this.deselectLast();
            }
        }
    };
    SelectComponent.prototype.handleSingleFilterKeydown = function (event) {
        var key = event.which;
        if (key === this.KEYS.ESC || key === this.KEYS.TAB
            || key === this.KEYS.UP || key === this.KEYS.DOWN
            || key === this.KEYS.ENTER) {
            this.handleSelectContainerKeydown(event);
        }
    };
    /** View. **/
    SelectComponent.prototype.focus = function () {
        this.hasFocus = true;
        if (this.multiple && this.filterEnabled) {
            this.filterInput.nativeElement.focus();
        }
        else {
            this.selectionSpan.nativeElement.focus();
        }
    };
    SelectComponent.prototype.blur = function () {
        this.hasFocus = false;
        this.selectionSpan.nativeElement.blur();
    };
    SelectComponent.prototype.updateWidth = function () {
        this.width = this.selectionSpan.nativeElement.offsetWidth;
    };
    SelectComponent.prototype.updatePosition = function () {
        var e = this.selectionSpan.nativeElement;
        this.left = e.offsetLeft;
        this.top = e.offsetTop + e.offsetHeight;
    };
    SelectComponent.prototype.updateFilterWidth = function () {
        if (typeof this.filterInput !== 'undefined') {
            var value = this.filterInput.nativeElement.value;
            this.filterInputWidth = value.length === 0 ?
                1 + this.placeholderView.length * 10 : 1 + value.length * 10;
        }
    };
    SelectComponent.prototype.pickTextColorBasedOnBgColor = function (bgColor, lightColor, darkColor) {
        if (lightColor === void 0) { lightColor = '#ffffff'; }
        if (darkColor === void 0) { darkColor = '#000000'; }
        if (!bgColor) {
            return darkColor;
        }
        var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
        var r = parseInt(color.substring(0, 2), 16); // hexToR
        var g = parseInt(color.substring(2, 4), 16); // hexToG
        var b = parseInt(color.substring(4, 6), 16); // hexToB
        var uicolors = [r / 255, g / 255, b / 255];
        var c = uicolors.map(function (col) {
            if (col <= 0.03928) {
                return col / 12.92;
            }
            return Math.pow((col + 0.055) / 1.055, 2.4);
        });
        var L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
        return (L > 0.179) ? darkColor : lightColor;
    };
    return SelectComponent;
}());
SelectComponent.decorators = [
    { type: core_1.Component, args: [{
                selector: 'ng-select-custom',
                template: select_component_html_1.TEMPLATE,
                styles: [select_component_css_1.STYLE],
                providers: [exports.SELECT_VALUE_ACCESSOR],
                encapsulation: core_1.ViewEncapsulation.None
            },] },
];
/** @nocollapse */
SelectComponent.ctorParameters = function () { return []; };
SelectComponent.propDecorators = {
    'options': [{ type: core_1.Input },],
    'allowClear': [{ type: core_1.Input },],
    'disabled': [{ type: core_1.Input },],
    'highlightColor': [{ type: core_1.Input },],
    'highlightTextColor': [{ type: core_1.Input },],
    'multiple': [{ type: core_1.Input },],
    'noFilter': [{ type: core_1.Input },],
    'notFoundMsg': [{ type: core_1.Input },],
    'placeholder': [{ type: core_1.Input },],
    'maxDisplayedOptions': [{ type: core_1.Input },],
    'maxDisplayedOptionsMessage': [{ type: core_1.Input },],
    'optionsListValueKey': [{ type: core_1.Input },],
    'optionsListLabelKey': [{ type: core_1.Input },],
    'optionsListColorKey': [{ type: core_1.Input },],
    'notifyChangeBeforeOptionsLoaded': [{ type: core_1.Input },],
    'fetchFallbackOption': [{ type: core_1.Input },],
    'opened': [{ type: core_1.Output },],
    'closed': [{ type: core_1.Output },],
    'selected': [{ type: core_1.Output },],
    'deselected': [{ type: core_1.Output },],
    'noOptionsFound': [{ type: core_1.Output },],
    'selectionSpan': [{ type: core_1.ViewChild, args: ['selection',] },],
    'dropdown': [{ type: core_1.ViewChild, args: ['dropdown',] },],
    'filterInput': [{ type: core_1.ViewChild, args: ['filterInput',] },],
};
exports.SelectComponent = SelectComponent;
