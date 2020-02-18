"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var option_1 = require("./option");
var diacritics_1 = require("./diacritics");
var OptionList = (function () {
    function OptionList(options, optionsListValueKey, optionsListLabelKey, maxDisplayedOptions, optionsListColorKey) {
        var _this = this;
        /* Consider using these for performance improvement. */
        // private _selection: Array<Option>;
        // private _filtered: Array<Option>;
        // private _value: Array<string>;
        this._highlightedOption = null;
        this._optionsListValueKey = optionsListValueKey;
        this._optionsListLabelKey = optionsListLabelKey;
        this._maxDisplayedOptions = maxDisplayedOptions;
        this._optionsListColorKey = optionsListColorKey;
        if (typeof options === 'undefined' || options === null) {
            options = [];
        }
        this._options = options.map(function (option) {
            // Convert the value to string to match the default HTML select behaviour
            var o = new option_1.Option(String(option[_this._optionsListValueKey]), option[_this._optionsListLabelKey], option[_this._optionsListColorKey]);
            if (option.disabled) {
                o.disable();
            }
            return o;
        });
        this._hasShown = this._options.length > 0;
        this.highlight();
    }
    Object.defineProperty(OptionList.prototype, "options", {
        /** Options. **/
        get: function () {
            return this._options;
        },
        enumerable: true,
        configurable: true
    });
    OptionList.prototype.getOptionsByValue = function (value) {
        return this.options.filter(function (option) {
            return option.value === value;
        });
    };
    /**
     * Create a new option at the end of the options list for a fallback option
     * @param {string} label The label to be displayed
     * @param {string} value The value of the option
     */
    OptionList.prototype.pushFallbackOption = function (label, value) {
        // Convert the value to string to match the default HTML select behaviour
        var o = new option_1.Option(value, label);
        o.inactive = true;
        this._options.push(o);
    };
    Object.defineProperty(OptionList.prototype, "value", {
        /** Value. **/
        get: function () {
            return this.selection.map(function (selectedOption) {
                return selectedOption.value;
            });
        },
        /**
         * @deprecated
         * @param v
         */
        set: function (v) {
            v = typeof v === 'undefined' || v === null ? [] : v;
            this.options.forEach(function (option) {
                option.selected = v.indexOf(option.value) > -1;
            });
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Marks the options that match the given value as selected
     * @param v The items to be selected
     * @returns {boolean} True if at least one item has been selected
     */
    OptionList.prototype.setValue = function (v) {
        var oneItemsHasBeenSelected = false;
        v = typeof v === 'undefined' || v === null ? [] : v;
        this.options.forEach(function (option) {
            option.selected = v.indexOf(option.value) > -1;
            oneItemsHasBeenSelected = oneItemsHasBeenSelected || option.selected;
        });
        return oneItemsHasBeenSelected;
    };
    Object.defineProperty(OptionList.prototype, "selection", {
        /** Selection. **/
        get: function () {
            return this.options.filter(function (option) {
                return option.selected;
            });
        },
        enumerable: true,
        configurable: true
    });
    OptionList.prototype.select = function (option, multiple) {
        if (!multiple) {
            this.clearSelection();
        }
        option.selected = true;
    };
    OptionList.prototype.deselect = function (option) {
        option.selected = false;
    };
    OptionList.prototype.clearSelection = function () {
        this.options.forEach(function (option) {
            option.selected = false;
        });
    };
    Object.defineProperty(OptionList.prototype, "filtered", {
        /** Filter. **/
        get: function () {
            var visibleItems = this.options.filter(function (option) {
                return option.shown;
            });
            if (visibleItems.length > this._maxDisplayedOptions) {
                visibleItems = visibleItems.slice(0, this._maxDisplayedOptions);
                this._hasMaxDisplayedOptions = true;
            }
            else {
                this._hasMaxDisplayedOptions = false;
            }
            return visibleItems;
        },
        enumerable: true,
        configurable: true
    });
    OptionList.prototype.filter = function (term) {
        var anyShown = false;
        if (term.trim() === '') {
            this.resetFilter();
            anyShown = this.options.length > 0;
        }
        else {
            this.options.forEach(function (option) {
                var l = diacritics_1.Diacritics.strip(option.label).toUpperCase();
                var t = diacritics_1.Diacritics.strip(term).toUpperCase();
                option.shown = l.indexOf(t) > -1;
                if (option.shown) {
                    anyShown = true;
                }
            });
        }
        var toEmpty = this.hasShown && !anyShown;
        this.highlight();
        this._hasShown = anyShown;
        return toEmpty;
    };
    OptionList.prototype.resetFilter = function () {
        this.options.forEach(function (option) {
            option.shown = true;
        });
    };
    Object.defineProperty(OptionList.prototype, "highlightedOption", {
        /** Highlight. **/
        get: function () {
            return this._highlightedOption;
        },
        enumerable: true,
        configurable: true
    });
    OptionList.prototype.highlight = function () {
        var option = this.hasShownSelected() ?
            this.getFirstShownSelected() : this.getFirstShown();
        this.highlightOption(option);
    };
    OptionList.prototype.highlightOption = function (option) {
        this.clearHighlightedOption();
        if (option !== null) {
            option.highlighted = true;
            this._highlightedOption = option;
        }
    };
    OptionList.prototype.highlightNextOption = function () {
        var shownOptions = this.filtered;
        var index = this.getHighlightedIndexFromList(shownOptions);
        if (index > -1 && index < shownOptions.length - 1) {
            this.highlightOption(shownOptions[index + 1]);
        }
    };
    OptionList.prototype.highlightPreviousOption = function () {
        var shownOptions = this.filtered;
        var index = this.getHighlightedIndexFromList(shownOptions);
        if (index > 0) {
            this.highlightOption(shownOptions[index - 1]);
        }
    };
    OptionList.prototype.clearHighlightedOption = function () {
        if (this.highlightedOption !== null) {
            this.highlightedOption.highlighted = false;
            this._highlightedOption = null;
        }
    };
    OptionList.prototype.getHighlightedIndexFromList = function (options) {
        for (var i = 0; i < options.length; i++) {
            if (options[i].highlighted) {
                return i;
            }
        }
        return -1;
    };
    OptionList.prototype.getHighlightedIndex = function () {
        return this.getHighlightedIndexFromList(this.filtered);
    };
    Object.defineProperty(OptionList.prototype, "hasShown", {
        /** Util. **/
        get: function () {
            return this._hasShown;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OptionList.prototype, "hasMaxDisplayedOptions", {
        /**
         * Returns true if the list contains displays more items than _hasMaxDisplayedOptions
         * @returns {boolean}
         */
        get: function () {
            return this._hasMaxDisplayedOptions;
        },
        enumerable: true,
        configurable: true
    });
    OptionList.prototype.hasSelected = function () {
        return this.options.some(function (option) {
            return option.selected;
        });
    };
    OptionList.prototype.hasShownSelected = function () {
        return this.options.some(function (option) {
            return option.shown && option.selected;
        });
    };
    OptionList.prototype.getFirstShown = function () {
        for (var _i = 0, _a = this.options; _i < _a.length; _i++) {
            var option = _a[_i];
            if (option.shown) {
                return option;
            }
        }
        return null;
    };
    OptionList.prototype.getFirstShownSelected = function () {
        for (var _i = 0, _a = this.options; _i < _a.length; _i++) {
            var option = _a[_i];
            if (option.shown && option.selected) {
                return option;
            }
        }
        return null;
    };
    // v0 and v1 are assumed not to be undefined or null.
    OptionList.equalValues = function (v0, v1) {
        if (v0.length !== v1.length) {
            return false;
        }
        var a = v0.slice().sort();
        var b = v1.slice().sort();
        return a.every(function (v, i) {
            return v === b[i];
        });
    };
    return OptionList;
}());
exports.OptionList = OptionList;
