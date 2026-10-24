/** Modal focus management shared by pause, help and the city map. */
export class DialogController {
  element: HTMLElement;
  previousFocus: HTMLElement | null = null;
  onKeyDown: (event: KeyboardEvent) => void;
  constructor(element: HTMLElement) {
    this.element = element;
    this.onKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const targets = [
        ...element.querySelectorAll<HTMLElement>('button:not(:disabled), [href], [tabindex="0"]'),
      ];
      if (!targets.length) return;
      const first = targets[0],
        last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    element.addEventListener('keydown', this.onKeyDown);
  }
  setOpen(open: boolean) {
    if (open === !this.element.hidden) return;
    if (open) {
      this.previousFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.element.hidden = false;
      this.element.querySelector('button')?.focus({ preventScroll: true });
    } else {
      const restore = this.element.contains(document.activeElement);
      this.element.hidden = true;
      if (restore) this.previousFocus?.focus({ preventScroll: true });
    }
  }
  destroy() {
    this.element.removeEventListener('keydown', this.onKeyDown);
  }
}
