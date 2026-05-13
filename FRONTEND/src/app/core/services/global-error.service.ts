import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalErrorService {
  readonly message = signal<string | null>(null);

  setMessage(msg: string | null): void {
    this.message.set(msg);
  }

  clear(): void {
    this.message.set(null);
  }
}
