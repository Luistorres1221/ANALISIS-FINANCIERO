import { Component, input } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  template: `
    <div class="metric">
      <div class="metric-label">{{ label() }}</div>
      <div class="metric-value">{{ value() }}</div>
      @if (hint()) {
        <div class="metric-hint">{{ hint() }}</div>
      }
    </div>
  `,
  styleUrl: './metric-card.component.css',
})
export class MetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input<string>();
}
