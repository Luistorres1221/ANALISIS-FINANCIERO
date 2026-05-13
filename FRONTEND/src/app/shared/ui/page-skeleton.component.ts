import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-skeleton',
  template: `
    <div class="skel" [style.height.px]="height()"></div>
  `,
  styles: `
    .skel {
      border-radius: 12px;
      background: linear-gradient(
        90deg,
        var(--surface-2) 0%,
        color-mix(in srgb, var(--text) 8%, var(--surface-2)) 50%,
        var(--surface-2) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `,
})
export class PageSkeletonComponent {
  readonly height = input(120);
}
