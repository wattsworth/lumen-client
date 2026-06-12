// from https://github.com/ng-select/ng-select/blob/master/src/ng-option-highlight/lib/ng-option-highlight.directive.ts
// since the package is not updated in NPM

import {
    AfterViewInit,
    Directive,
    ElementRef,
    Input,
    OnChanges,
    Renderer2
} from '@angular/core';

@Directive({
    selector: '[ngOptionHighlight]',
    standalone: false
})
export class NgOptionHighlightDirective implements OnChanges, AfterViewInit {

    @Input('ngOptionHighlight') term: string;

    private element: HTMLElement;
    private label: string;

    constructor(
        private elementRef: ElementRef,
        private renderer: Renderer2) {
        this.element = this.elementRef.nativeElement;
    }

    ngOnChanges() {
        if (this._canHighlight) {
            this._highlightLabel();
        }
    }

    ngAfterViewInit() {
        this.label = this.element.innerHTML;
        if (this._canHighlight) {
            this._highlightLabel();
        }
    }

    private _escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private _highlightLabel() {
        const label = this.label;
        if (!this.term) {
            this._setInnerHtml(label);
            return;
        }

        //replacement from https://github.com/ng-select/ng-select/issues/1943#issuecomment-901122927
        const alternationString = this._escapeRegExp(this.term).replace(/\s/g, '|');
        //const alternationString = this._escapeRegExp(this.term).replace(' ', '|');
        const termRegex = new RegExp(alternationString, 'gi');
        this._setInnerHtml(label.replace(termRegex, `<span class=\"highlighted\">$&</span>`))
    }

    private get _canHighlight() {
        return this._isDefined(this.term) && this._isDefined(this.label);
    }

    private _setInnerHtml(html: string) {
        this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', html);
    }

    private _isDefined(value: any) {
        return value !== undefined && value !== null;
    }
}