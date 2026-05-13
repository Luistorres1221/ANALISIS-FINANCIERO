import { Component, computed, effect, inject, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AppStatusService } from '../../core/services/app-status.service';
import { MetricCardComponent } from '../../shared/ui/metric-card.component';
import { PageSkeletonComponent } from '../../shared/ui/page-skeleton.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [MetricCardComponent, PageSkeletonComponent, BaseChartDirective],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent {
  protected readonly status = inject(AppStatusService);

  /** Símbolo del gráfico de precios (últimos días de cierre). */
  protected readonly priceChartSymbol = signal<string>('');

  constructor() {
    effect(() => {
      const syms = this.status.symbols();
      if (syms.length === 0) {
        return;
      }
      const cur = this.priceChartSymbol();
      if (!cur || !syms.includes(cur)) {
        this.priceChartSymbol.set(syms.includes('AAPL') ? 'AAPL' : syms[0]);
      }
    });
  }

  protected readonly metrics = computed(() => {
    const a = this.status.analysis();
    const ds = this.status.dataset();
    const r = a?.ranking ?? [];
    const n = r.length;
    const avgVol = n ? r.reduce((s, x) => s + x.volatilidad, 0) / n : 0;
    const maxVol = n ? Math.max(...r.map((x) => x.volatilidad)) : 0;
    const agresivos = r.filter((x) => x.riesgo === 'AGRESIVO').length;
    return {
      activos: String(n),
      obs: String(ds.length),
      avgVol: avgVol.toFixed(4),
      maxVol: maxVol.toFixed(4),
      agresivos: String(agresivos),
    };
  });

  protected readonly volBar = computed<ChartConfiguration<'bar'>>(() => {
    const r = this.status.analysis()?.ranking ?? [];
    const top = [...r].sort((a, b) => b.volatilidad - a.volatilidad).slice(0, 8);
    return {
      type: 'bar',
      data: {
        labels: top.map((x) => x.activo),
        datasets: [
          {
            label: 'Volatilidad anualizada',
            data: top.map((x) => x.volatilidad),
            backgroundColor: 'rgba(255, 167, 95, 0.45)',
            borderColor: 'rgba(255, 167, 95, 0.9)',
            borderWidth: 1,
          },
        ],
      },
      options: this.chartOpts(),
    };
  });

  protected readonly priceLine = computed<ChartConfiguration<'line'>>(() => {
    const ds = this.status.dataset();
    const syms = this.status.symbols();
    const picked = this.priceChartSymbol();
    const sym =
      picked && syms.includes(picked) ? picked : syms.includes('AAPL') ? 'AAPL' : syms[0] ?? 'AAPL';
    // API: columnas OHLC por símbolo (`AAPL_close`, no `AAPL`) — ver ETLServiceImpl.unifyData.
    const closeKey = `${sym}_close`;
    const slice = ds.slice(-90);
    return {
      type: 'line',
      data: {
        labels: slice.map((row) => String(row['date'])),
        datasets: [
          {
            label: `Cierre ${sym}`,
            data: slice.map((row) => {
              const v = row[closeKey];
              if (v === null || v === undefined || v === '') {
                return NaN;
              }
              const n = typeof v === 'number' ? v : Number(v);
              return Number.isFinite(n) ? n : NaN;
            }),
            borderColor: 'rgba(255, 167, 95, 0.95)',
            backgroundColor: 'rgba(255, 167, 95, 0.12)',
            fill: true,
            tension: 0.25,
            pointRadius: 0,
          },
        ],
      },
      options: this.chartOpts(),
    };
  });

  private chartOpts() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#dec7ad' },
        },
      },
      scales: {
        x: {
          ticks: { color: '#dec7ad', maxRotation: 0 },
          grid: { color: 'rgba(227,181,134,0.14)' },
        },
        y: {
          ticks: { color: '#dec7ad' },
          grid: { color: 'rgba(227,181,134,0.14)' },
        },
      },
    };
  }
}
