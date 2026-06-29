import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface AdminLink {
  label: string;
  description: string;
  route: string;
  icon: string;
}

interface AdminSection {
  title: string;
  links: AdminLink[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  readonly sections: AdminSection[] = [
    {
      title: 'Overview',
      links: [
        {
          label: 'Statistics dashboard',
          description: 'Orders, revenue, ratings, and top products.',
          route: '/admin/dashboard',
          icon: 'insights',
        },
        {
          label: 'Operations',
          description: 'Browse and export orders and ingredients.',
          route: '/admin/operations',
          icon: 'inventory_2',
        },
      ],
    },
    {
      title: 'Catalog',
      links: [
        {
          label: 'Categories',
          description: 'Organize the menu into categories.',
          route: '/admin/categories',
          icon: 'category',
        },
        {
          label: 'Products',
          description: 'Add menu items with components and optional extras.',
          route: '/admin/products',
          icon: 'restaurant',
        },
        {
          label: 'Ingredients',
          description: 'Create and maintain product ingredients.',
          route: '/admin/ingredients',
          icon: 'egg',
        },
      ],
    },
    {
      title: 'Staff & moderation',
      links: [
        {
          label: 'Employees',
          description: 'Manage kitchen, delivery, and admin staff.',
          route: '/admin/employees',
          icon: 'groups',
        },
        {
          label: 'Reviews',
          description: 'View customer feedback and remove inappropriate reviews.',
          route: '/reviews',
          icon: 'rate_review',
        },
      ],
    },
    {
      title: 'Configuration',
      links: [
        {
          label: 'Delivery zones',
          description: 'Cities, delivery fees, and estimated times.',
          route: '/delivery-zones',
          icon: 'map',
        },
        {
          label: 'Business hours',
          description: 'Weekly schedule and special closing dates.',
          route: '/business-hours',
          icon: 'schedule',
        },
      ],
    },
  ];
}
