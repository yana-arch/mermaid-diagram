
import 'zone.js';
import 'zone.js/testing';
import '@analogjs/vitest-angular/setup-snapshots';
import '@analogjs/vitest-angular/setup-testbed';

import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { getTestBed } from '@angular/core/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
