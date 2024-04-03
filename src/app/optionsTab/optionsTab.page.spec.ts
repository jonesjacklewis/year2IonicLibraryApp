import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionsTabPage } from './optionsTab.page';

describe('OptionsTabPage', () => {
  let component: OptionsTabPage;
  let fixture: ComponentFixture<OptionsTabPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(OptionsTabPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
