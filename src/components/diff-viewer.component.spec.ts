import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DiffViewerComponent } from './diff-viewer.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('DiffViewerComponent', () => {
  let component: DiffViewerComponent;
  let fixture: ComponentFixture<DiffViewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DiffViewerComponent]
    });
    fixture = TestBed.createComponent(DiffViewerComponent);
    component = fixture.componentInstance;
  });

  it('should compile and compute LCS diff for identical code', () => {
    fixture.componentRef.setInput('oldCode', 'graph TD\nA-->B');
    fixture.componentRef.setInput('newCode', 'graph TD\nA-->B');
    fixture.detectChanges();

    const diff = component.diffLines();
    expect(diff.length).toBe(2);
    expect(diff[0].type).toBe('unchanged');
    expect(diff[0].content).toBe('graph TD');
    expect(diff[1].type).toBe('unchanged');
    expect(diff[1].content).toBe('A-->B');
  });

  it('should compute added lines correctly', () => {
    fixture.componentRef.setInput('oldCode', 'graph TD\nA-->B');
    fixture.componentRef.setInput('newCode', 'graph TD\nA-->B\nB-->C');
    fixture.detectChanges();

    const diff = component.diffLines();
    expect(diff.length).toBe(3);
    expect(diff[0].type).toBe('unchanged');
    expect(diff[1].type).toBe('unchanged');
    expect(diff[2].type).toBe('added');
    expect(diff[2].content).toBe('B-->C');
    expect(diff[2].proposedIndex).toBe(3);
  });

  it('should compute removed lines correctly', () => {
    fixture.componentRef.setInput('oldCode', 'graph TD\nA-->B\nB-->C');
    fixture.componentRef.setInput('newCode', 'graph TD\nA-->B');
    fixture.detectChanges();

    const diff = component.diffLines();
    expect(diff.length).toBe(3);
    expect(diff[0].type).toBe('unchanged');
    expect(diff[1].type).toBe('unchanged');
    expect(diff[2].type).toBe('removed');
    expect(diff[2].content).toBe('B-->C');
    expect(diff[2].originalIndex).toBe(3);
  });

  it('should compute mixed replacements correctly', () => {
    fixture.componentRef.setInput('oldCode', 'graph TD\nA-->B');
    fixture.componentRef.setInput('newCode', 'graph LR\nA-->B');
    fixture.detectChanges();

    const diff = component.diffLines();
    expect(diff.length).toBe(3);
    
    // First line changed (removed old, added new)
    expect(diff[0].type).toBe('removed');
    expect(diff[0].content).toBe('graph TD');
    
    expect(diff[1].type).toBe('added');
    expect(diff[1].content).toBe('graph LR');
    
    // Second line unchanged
    expect(diff[2].type).toBe('unchanged');
    expect(diff[2].content).toBe('A-->B');
  });
});
