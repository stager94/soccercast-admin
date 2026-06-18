import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);

    try {
      await this.authService.login(this.email(), this.password());
      this.router.navigate(['/']);
    } catch (err: unknown) {
      const message =
        err instanceof HttpErrorResponse
          ? (err.error?.error ?? 'An error occurred. Please try again.')
          : 'An error occurred. Please try again.';
      this.error.set(message);
    } finally {
      this.loading.set(false);
    }
  }
}
