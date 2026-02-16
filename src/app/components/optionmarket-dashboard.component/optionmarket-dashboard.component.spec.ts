import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionmarketDashboardComponent } from './optionmarket-dashboard.component';

describe('OptionmarketDashboardComponent', () => {
  let component: OptionmarketDashboardComponent;
  let fixture: ComponentFixture<OptionmarketDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionmarketDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionmarketDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
