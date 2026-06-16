import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { Country } from '../../core/models/country.model';
import { CountryService } from '../../core/services/country.service';

@Component({
  selector: 'app-country-select',
  imports: [],
  templateUrl: './country-select.html',
})
export class CountrySelect implements OnInit {
  private readonly countryService = inject(CountryService);
  private readonly elementRef = inject(ElementRef);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  readonly value = input<number | null>(null);
  readonly valueChange = output<number | null>();

  readonly countries = signal<Country[]>([]);
  readonly loading = signal(true);
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');

  readonly filteredCountries = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.countries();
    return this.countries().filter((c) => c.name.toLowerCase().includes(q));
  });

  readonly selectedCountry = computed(() => {
    const id = this.value();
    if (id === null) return null;
    return this.countries().find((c) => c.id === id) ?? null;
  });

  ngOnInit(): void {
    this.countryService
      .getAll(1, 100)
      .pipe(
        switchMap((first) => {
          if (first.meta.total_pages <= 1) return of(first.data);
          const pages = Array.from({ length: first.meta.total_pages - 1 }, (_, i) =>
            this.countryService.getAll(i + 2, 100).pipe(map((r) => r.data)),
          );
          return forkJoin(pages).pipe(
            map((rest) => [...first.data, ...rest.flat()]),
          );
        }),
      )
      .subscribe({
        next: (countries) => {
          this.countries.set(countries);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    const opening = !this.isOpen();
    this.isOpen.set(opening);
    if (opening) {
      this.searchQuery.set('');
      setTimeout(() => this.searchInputRef?.nativeElement.focus(), 0);
    }
  }

  select(id: number | null, event?: MouseEvent): void {
    event?.stopPropagation();
    this.valueChange.emit(id);
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit(null);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isOpen.set(false);
  }
}
