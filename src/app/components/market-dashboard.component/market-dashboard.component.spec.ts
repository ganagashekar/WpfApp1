import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketDashboardComponent } from './market-dashboard.component';

describe('MarketDashboardComponent', () => {
  let component: MarketDashboardComponent;
  let fixture: ComponentFixture<MarketDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
