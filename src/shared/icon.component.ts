import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/** Names of the icons this component can render. */
export type IconName = 'close';

/**
 * Small inline-SVG icon component for icons reused across the app.
 *
 * Centralises SVG markup that was previously copy-pasted inline (e.g. the
 * "close" X repeated in every modal header). Icons inherit color via
 * `currentColor` and are sized with the `size` input. Decorative by default
 * (aria-hidden); pass an aria-label on the host button for accessibility.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (name()) {
      @case ('close') {
        <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="size()" [attr.height]="size()"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      }
    }
  `,
})
export class IconComponent {
  name = input.required<IconName>();
  size = input<number>(24);
}
