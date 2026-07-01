import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true,
    },
  ],
})
export class StarRatingComponent implements ControlValueAccessor {
  readonly readonly = input(false);
  readonly compact = input(false);
  /** Display-only value when not bound to a form control. */
  readonly rating = input<number | null>(null);

  readonly stars = [1, 2, 3, 4, 5];
  readonly value = signal(0);
  readonly hoverValue = signal(0);
  readonly isDisabled = signal(false);

  private onChange: (value: number) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: number | null): void {
    this.value.set(typeof value === 'number' ? value : 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  displayRating(): number {
    const external = this.rating();
    if (external !== null) {
      return external;
    }
    return this.hoverValue() || this.value();
  }

  selectedRating(): number {
    const external = this.rating();
    return external !== null ? external : this.value();
  }

  isFilled(star: number): boolean {
    return star <= this.displayRating();
  }

  setRating(rating: number): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }

    this.value.set(rating);
    this.onChange(rating);
    this.onTouched();
  }

  onStarEnter(star: number): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    this.hoverValue.set(star);
  }

  onStarsLeave(): void {
    this.hoverValue.set(0);
  }
}
