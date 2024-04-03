import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewBooksTabPage } from './viewBooksTab.page';

describe('ViewBooksTabPage', () => {
  let component: ViewBooksTabPage;
  let fixture: ComponentFixture<ViewBooksTabPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ViewBooksTabPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
