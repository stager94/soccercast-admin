import { Component, output } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
})
export class Header {
  readonly toggleSidebar = output<void>();
}
