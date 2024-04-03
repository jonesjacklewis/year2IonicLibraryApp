import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { map } from 'rxjs';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'viewBooks',
        loadComponent: () =>
          import('../viewBooksTab/viewBooksTab.page').then((m) => m.ViewBooksTabPage),
      },
      {
        path: 'addBooks',
        loadComponent: () =>
          import('../addBooksTab/addBooksTab.page').then((m) => m.AddBooksTabPage),
      },
      {
        path: 'mapMode',
        loadComponent: () =>
          import('../mapModeTab/mapModeTab.page').then((m) => m.MapModeTabPage),
      },
      {
        path: 'options',
        loadComponent: () =>
          import('../optionsTab/optionsTab.page').then((m) => m.OptionsTabPage),
      },
      {
        path: '',
        redirectTo: '/tabs/viewBooks',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/viewBooks',
    pathMatch: 'full',
  },
];
