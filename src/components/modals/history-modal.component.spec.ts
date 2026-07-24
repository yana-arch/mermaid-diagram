import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryModalComponent } from './history-modal.component';
import { HistoryItem } from '../../services/core/app-state.service';

function item(id: string, label: string, code: string, timestamp = 0): HistoryItem {
  return { id, label, code, timestamp };
}

describe('HistoryModalComponent filtering', () => {
  let component: HistoryModalComponent;
  let fixture: ComponentFixture<HistoryModalComponent>;

  const items: HistoryItem[] = [
    item('1', 'Auth Flow', 'flowchart TD\n  Login-->Home'),
    item('2', 'Database ERD', 'erDiagram\n  USER ||--o{ ORDER : places'),
    item('3', 'Untitled', 'sequenceDiagram\n  Alice->>Bob: Hi'),
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HistoryModalComponent] });
    fixture = TestBed.createComponent(HistoryModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('history', items);
    fixture.detectChanges();
  });

  it('returns all items when the search term is empty', () => {
    expect(component.displayedItems().length).toBe(3);
  });

  it('matches on the label (case-insensitive)', () => {
    component.searchTerm.set('auth');
    expect(component.displayedItems().map(i => i.id)).toEqual(['1']);
  });

  it('matches on the code body', () => {
    component.searchTerm.set('erDiagram');
    expect(component.displayedItems().map(i => i.id)).toEqual(['2']);
  });

  it('trims whitespace before matching', () => {
    component.searchTerm.set('  database  ');
    expect(component.displayedItems().map(i => i.id)).toEqual(['2']);
  });

  it('returns an empty list when nothing matches', () => {
    component.searchTerm.set('nonexistent');
    expect(component.displayedItems()).toEqual([]);
  });
});
