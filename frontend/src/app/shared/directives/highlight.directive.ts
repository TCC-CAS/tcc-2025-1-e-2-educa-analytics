import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {
  @Input() appHighlight = 'yellow';
  @Input() highlightColor = '#ffff00';

  constructor(private el: ElementRef) {
    this.el.nativeElement.style.backgroundColor = this.highlightColor;
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.el.nativeElement.style.opacity = '0.8';
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.el.nativeElement.style.opacity = '1';
  }
}
