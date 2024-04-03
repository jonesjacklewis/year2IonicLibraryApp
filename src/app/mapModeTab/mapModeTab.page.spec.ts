import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapModeTabPage } from './mapModeTab.page';

describe('MapModeTabPage', () => {
  let component: MapModeTabPage;
  let fixture: ComponentFixture<MapModeTabPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(MapModeTabPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
