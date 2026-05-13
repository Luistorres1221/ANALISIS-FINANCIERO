import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { EtlApiService } from '../../core/services/etl-api.service';
import { PageSkeletonComponent } from '../../shared/ui/page-skeleton.component';
import { AssetVolumeDay, SortingResultData } from '../../shared/models/etl.models';

const DEFAULT_SIZE = 8192;

@Component({
  selector: 'app-ordenamiento-page',
  imports: [BaseChartDirective, FormsModule, PageSkeletonComponent],
  templateUrl: './ordenamiento-page.component.html',
  styleUrl: './ordenamiento-page.component.css',
})
export class OrdenamientoPageComponent implements OnInit {
  private readonly etl = inject(EtlApiService);

  protected readonly sizeInput = signal(DEFAULT_SIZE);
  protected readonly rows = signal<SortingResultData[] | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly topVolumeDays = signal<AssetVolumeDay[]>([]);
  protected readonly loadingTopVolume = signal(false);
  protected readonly topVolumeError = signal<string | null>(null);

  protected readonly sortBar = computed<ChartConfiguration<'bar'>>(() => {
    const list = this.rows() ?? [];
    return {
      type: 'bar',
      data: {
        labels: list.map((x) => x.algorithm),
        datasets: [
          {
            label: 'Tiempo',
            data: list.map((x) => x.time),
            backgroundColor: 'rgba(255, 167, 95, 0.45)',
            borderColor: 'rgba(255, 167, 95, 0.9)',
            borderWidth: 1,
          },
        ],
      },
      options: this.chartOpts(list[0]?.size),
    };
  });

  ngOnInit(): void {
    this.load();
    this.loadTopVolumeDays();
  }

  protected onSizeChange(value: string | number): void {
    const n = typeof value === 'string' ? Number(value) : value;
    if (Number.isFinite(n) && n >= 1) {
      this.sizeInput.set(Math.floor(n));
    }
  }

  protected load(): void {
    const size = this.sizeInput();
    if (!Number.isFinite(size) || size < 1) {
      this.error.set('Indique un tamaño válido (entero ≥ 1).');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.etl.getTableSort(size).subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) => a.time - b.time);
        this.rows.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el benchmark. Verifique que el backend esté en ejecución.');
      },
    });
  }

  protected loadTopVolumeDays(): void {
    this.loadingTopVolume.set(true);
    this.topVolumeError.set(null);

    this.etl.getVolumenAsc().subscribe({
      next: (days) => {
        // El backend retorna en orden descendente (mayor a menor); aquí lo pedimos ascendente.
        const sorted = [...days].sort((a, b) => a.volume - b.volume);
        this.topVolumeDays.set(sorted);
        this.loadingTopVolume.set(false);
      },
      error: () => {
        this.loadingTopVolume.set(false);
        this.topVolumeError.set('No se pudo cargar el top de volumen desde el backend.');
      },
    });
  }

  private chartOpts(sampleSize: number | undefined): ChartConfiguration<'bar'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#dec7ad' },
        },
        title: {
          display: true,
          text:
            sampleSize != null
              ? `Tiempos de menor a mayor (izq. → der.), n = ${sampleSize}`
              : 'Tiempos de menor a mayor (izquierda a derecha)',
          color: '#dec7ad',
          font: { size: 13 },
        },
        tooltip: {
          backgroundColor: 'rgba(35, 17, 6, 0.92)',
          titleColor: '#f7ede1',
          bodyColor: '#e5d6c1',
          borderColor: 'rgba(255, 159, 67, 0.35)',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => {
              const v = ctx.raw;
              const n = typeof v === 'number' ? v : Number(v);
              return ` ${n.toLocaleString('es-CO')} Nanosegundos`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#dec7ad',
            maxRotation: 45,
            minRotation: 35,
            autoSkip: false,
          },
          grid: { color: 'rgba(227,181,134,0.14)' },
        },
        y: {
          title: {
            display: true,
            text: 'Tiempo (Nanosegundos)',
            color: '#dec7ad',
          },
          ticks: { color: '#dec7ad' },
          grid: { color: 'rgba(227,181,134,0.14)' },
        },
      },
    };
  }
}
