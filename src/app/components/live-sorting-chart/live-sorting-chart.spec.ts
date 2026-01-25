import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveSortingChart } from './live-sorting-chart';

describe('LiveSortingChart', () => {
  let component: LiveSortingChart;
  let fixture: ComponentFixture<LiveSortingChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveSortingChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveSortingChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
