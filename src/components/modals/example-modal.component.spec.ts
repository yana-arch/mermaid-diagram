import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ExampleModalComponent } from './example-modal.component';
import { ChartExample } from '../../data/chart-examples';

const examples: ChartExample[] = [
  { name: 'Flowchart Basics', category: 'Flowchart', code: 'flowchart TD' },
  { name: 'Sequence Login', category: 'Sequence', code: 'sequenceDiagram' },
  { name: 'Class Model', category: 'Class', code: 'classDiagram' },
  { name: 'Flow Advanced', category: 'Flowchart', code: 'flowchart LR' },
];

describe('ExampleModalComponent filtering', () => {
  let component: ExampleModalComponent;
  let fixture: ComponentFixture<ExampleModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ExampleModalComponent] });
    fixture = TestBed.createComponent(ExampleModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('examples', examples);
    fixture.detectChanges();
  });

  it('shows all examples by default', () => {
    expect(component.displayedItems().length).toBe(4);
  });

  it('derives unique categories sorted alphabetically', () => {
    expect(component.uniqueCategories()).toEqual(['Class', 'Flowchart', 'Sequence']);
  });

  it('filters by search term across name', () => {
    component.searchTerm.set('login');
    expect(component.displayedItems().map(e => e.name)).toEqual(['Sequence Login']);
  });

  it('filters by selected category', () => {
    component.selectedCategory.set('Flowchart');
    expect(component.displayedItems().map(e => e.name)).toEqual([
      'Flowchart Basics',
      'Flow Advanced',
    ]);
  });

  it('combines search and category filters', () => {
    component.selectedCategory.set('Flowchart');
    component.searchTerm.set('advanced');
    expect(component.displayedItems().map(e => e.name)).toEqual(['Flow Advanced']);
  });

  it('groups displayed items by category for the "All" view', () => {
    const groups = component.groupedDisplayedItems();
    const flowchart = groups.find(g => g.category === 'Flowchart');
    expect(flowchart?.items.length).toBe(2);
  });

  it('resetFilters clears search and category', () => {
    component.searchTerm.set('x');
    component.selectedCategory.set('Class');
    component.resetFilters();
    expect(component.searchTerm()).toBe('');
    expect(component.selectedCategory()).toBe('All');
  });
});
