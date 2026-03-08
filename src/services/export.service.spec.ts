import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { ExportService } from './export.service';
import { PLATFORM_ID } from '@angular/core';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExportService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not throw when trying to export chart', () => {
    // Basic structural test
    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mockSvg.setAttribute('viewBox', '0 0 100 100');
    
    // Mock downloadFile since we don't want to actually download in tests
    const spy = jest.spyOn(service as any, 'downloadFile').mockImplementation(() => {});
    
    // Just ensure it completes execution without throwing
    expect(() => {
      service.exportChart(mockSvg, 'svg', 1);
    }).not.toThrow();
  });
});
