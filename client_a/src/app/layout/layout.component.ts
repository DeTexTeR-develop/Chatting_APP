import { Component, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { AuthService } from '../core/services/auth.service';
import { SocketService } from '../core/services/socket.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <router-outlet />
  `,
})
export class LayoutComponent implements OnInit {
  constructor(private auth: AuthService, private socket: SocketService) {}

  ngOnInit(): void {
    // Connect socket when authenticated layout loads
    if (this.auth.isAuthenticated()) {
      this.socket.connect();
    }
  }
}
