import { TestBed } from '@angular/core/testing';

import { WebWorkerService } from './web-worker.service';

describe('WebWorkerServiceService', () => {
  let service: WebWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebWorkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
