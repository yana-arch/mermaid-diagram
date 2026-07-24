import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [IconComponent] });
    fixture = TestBed.createComponent(IconComponent);
  });

  it('renders the close icon as an svg with two lines', () => {
    fixture.componentRef.setInput('name', 'close');
    fixture.detectChanges();

    const svg: SVGSVGElement | null = fixture.nativeElement.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.querySelectorAll('line').length).toBe(2);
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('defaults to size 24 and honors the size input', () => {
    fixture.componentRef.setInput('name', 'close');
    fixture.detectChanges();
    let svg: SVGSVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');

    fixture.componentRef.setInput('size', 18);
    fixture.detectChanges();
    svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('18');
    expect(svg.getAttribute('height')).toBe('18');
  });
});
