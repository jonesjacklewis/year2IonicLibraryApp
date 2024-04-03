import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBooksTabPage } from './addBooksTab.page';

describe('AddBooksTabPage', () => {
  let component: AddBooksTabPage;
  let fixture: ComponentFixture<AddBooksTabPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(AddBooksTabPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
