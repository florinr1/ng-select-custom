"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Option = (function () {
    function Option(value, label, color) {
        if (color === void 0) { color = '#eeeeee'; }
        this.value = value;
        this.label = label;
        this.color = color;
        this.disabled = false;
        this.highlighted = false;
        this.selected = false;
        this.shown = true;
    }
    Option.prototype.show = function () {
        this.shown = true;
    };
    Option.prototype.hide = function () {
        this.shown = false;
    };
    Option.prototype.disable = function () {
        this.disabled = true;
    };
    Option.prototype.enable = function () {
        this.disabled = false;
    };
    Option.prototype.undecoratedCopy = function () {
        return {
            label: this.label,
            value: this.value
        };
    };
    return Option;
}());
exports.Option = Option;
