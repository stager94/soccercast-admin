import { Routes } from '@angular/router';

import { MainLayout } from './layout/main-layout/main-layout';
import { ApiFootballLogDetail } from './features/api-football-logs/api-football-log-detail/api-football-log-detail';
import { ApiFootballLogsList } from './features/api-football-logs/api-football-logs-list/api-football-logs-list';
import { CountriesList } from './features/countries/countries-list/countries-list';
import { FixtureDetail } from './features/fixtures/fixture-detail/fixture-detail';
import { FixturesList } from './features/fixtures/fixtures-list/fixtures-list';
import { QueueMonitor } from './features/queue/queue-monitor/queue-monitor';
import { LeagueDetail } from './features/leagues/league-detail/league-detail';
import { LeaguesList } from './features/leagues/leagues-list/leagues-list';
import { SeasonsList } from './features/seasons/seasons-list/seasons-list';
import { Dashboard } from './features/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Dashboard },
      { path: 'countries', component: CountriesList },
      { path: 'seasons', component: SeasonsList },
      { path: 'leagues', component: LeaguesList },
      { path: 'leagues/:id', component: LeagueDetail },
      { path: 'leagues/:leagueId/seasons/:seasonId/fixtures', component: FixturesList },
      { path: 'fixtures/:id', component: FixtureDetail },
      { path: 'queue', component: QueueMonitor },
      { path: 'api-football-logs', component: ApiFootballLogsList },
      { path: 'api-football-logs/:id', component: ApiFootballLogDetail },
    ],
  },
];
