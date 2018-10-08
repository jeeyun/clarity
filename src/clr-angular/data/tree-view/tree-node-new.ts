import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  Optional,
  Output,
  SkipSelf,
} from '@angular/core';
import { ClrTreeNodeModel } from './tree-node-model';
import { Expand } from '../../utils/expand/providers/expand';
import { UNIQUE_ID, UNIQUE_ID_PROVIDER } from '../../utils/id-generator/id-generator.service';
import { LoadingListener } from '../../utils/loading/loading-listener';
import { ClrCommonStrings } from '../../utils/i18n/common-strings.interface';
import { TreeSelectionService } from './providers/tree-selection.service';
import { clrTreeSelectionProviderFactory } from './providers/tree-selection.provider';
import { TreeService } from './providers/tree.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'clr-tree-node-new',
  template: `
    <div class="clr-tree-node-content-container">
      <button
        type="button"
        class="clr-treenode-caret"
        (click)="toggleExpand()"
        *ngIf="(nodeExpand.expandable || treeService.getChildren) && !nodeExpand.loading && !hideExpand"
        [attr.aria-expanded]="nodeExpand.expanded">
        <clr-icon
          class="clr-treenode-caret-icon"
          shape="caret"
          [attr.dir]="caretDirection"
          [attr.title]="caretTitle"></clr-icon>
      </button>
      <div class="clr-treenode-spinner-container" *ngIf="(nodeExpand.expandable || treeService.getChildren) && nodeExpand.loading && !hideExpand">
        <span class="clr-treenode-spinner spinner">
            Loading...
        </span>
      </div>
      <!-- TODO: Move this to new checkboxes. But the indeterminate two-way binding makes it hard. -->
      <clr-checkbox
        class="clr-treenode-checkbox"
        *ngIf="selectable"
        [(ngModel)]="model.selected"
        [(clrIndeterminate)]="model.indeterminate"
        [clrDisabled]="model.disabled"
        [clrAriaLabeledBy]="nodeId"></clr-checkbox>
      <div class="clr-treenode-content" [id]="nodeId">
        <ng-content></ng-content>
      </div>
    </div>
    <div
      class="clr-treenode-children"
      [@childNodesState]="state"
      [attr.role]="ariaTreeNodeChildrenRole">
      <ng-container #childNodesContainer></ng-container>
      <ng-content select="[clrIfExpanded]"></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    Expand,
    { provide: LoadingListener, useExisting: Expand },
    {
      provide: TreeSelectionService,
      useFactory: clrTreeSelectionProviderFactory,
      deps: [[new Optional(), new SkipSelf(), TreeSelectionService]],
    },
    UNIQUE_ID_PROVIDER,
  ],
  animations: [
    trigger('childNodesState', [
      state('expanded', style({ height: '*', 'overflow-y': 'hidden' })),
      state('collapsed', style({ height: 0, 'overflow-y': 'hidden' })),
      transition('expanded <=> collapsed', animate('0.2s ease-in-out')),
    ]),
  ],
  host: { '[class.clr-tree-node]': 'true' },
})
export class ClrTreeNodeNew<T = any> {
  private hideExpand: boolean = false;
  private _model: ClrTreeNodeModel<T>;

  @Input('clrTreeNodeModel')
  set model(model: ClrTreeNodeModel<T>) {
    this._model = model;
    if (this.parent) {
      console.log(this.parent.model);
      this.model.parent = this.parent.model;
      this.parent.register(this);
    }
  }

  get model() {
    return this._model;
  }

  constructor(
    public nodeExpand: Expand,
    @Optional()
    @SkipSelf()
    public parent: ClrTreeNodeNew,
    public treeSelectionService: TreeSelectionService,
    @Inject(UNIQUE_ID) public nodeId: string,
    public commonStrings: ClrCommonStrings,
    private cdr: ChangeDetectorRef,
    public treeService: TreeService
  ) {
    this.treeSelectionService.selectable = true;
  }

  get selectable(): boolean {
    if (this.treeSelectionService) {
      return this.treeSelectionService.selectable;
    }
    return false;
  }

  register(childNode: ClrTreeNodeNew<T>): void {
    if (this.model.children.indexOf(childNode.model) === -1) {
      this.model.children.push(childNode.model);
    }
  }

  unregister(childNode: ClrTreeNodeNew<T>): void {
    const index = this.model.children.indexOf(childNode.model);
    if (index > -1) {
      this.model.children.splice(index, 1);
    }
  }

  @Input('clrSelected')
  public set nodeSelected(value: boolean) {
    // required for recursive trees to discard unset inputs.
    this.activateSelection();
    if (value === undefined || value === null) {
      return;
    }
    this.model.selected = value;
  }

  @Output('clrSelectedChange') nodeSelectedChange: EventEmitter<boolean> = new EventEmitter<boolean>(true);

  selectedChanged(): void {
    this.cdr.markForCheck();
    this.nodeSelectedChange.emit(this.model.selected);
  }

  @Input('clrIndeterminate')
  set nodeIndeterminate(value: boolean) {
    this.activateSelection();
    if (value === undefined || value === null) {
      return;
    }
    this.model.indeterminate = value;
  }

  @Output('clrIndeterminateChange') nodeIndeterminateChanged: EventEmitter<boolean> = new EventEmitter<boolean>(true);

  indeterminateChanged(): void {
    this.cdr.markForCheck();
    this.nodeIndeterminateChanged.emit(this.model.indeterminate);
  }

  toggleExpand(): void {
    this.nodeExpand.expanded = !this.nodeExpand.expanded;
  }

  public get caretDirection(): string {
    return this.nodeExpand.expanded ? 'down' : 'right';
  }

  public get caretTitle(): string {
    return this.nodeExpand.expanded ? this.commonStrings.collapse : this.commonStrings.expand;
  }

  get expanded(): boolean {
    return this.nodeExpand.expanded;
  }

  set expanded(value: boolean) {
    value = !!value;
    if (this.nodeExpand.expanded !== value) {
      this.nodeExpand.expanded = value;
    }
  }

  get state(): string {
    return this.expanded && !this.nodeExpand.loading ? 'expanded' : 'collapsed';
  }

  @HostBinding('attr.role')
  get treeNodeRole(): string {
    return this.model.parent ? 'treeitem' : 'tree';
  }

  @HostBinding('attr.aria-multiselectable')
  get rootAriaMultiSelectable(): boolean {
    if (this.model.parent || !this.selectable) {
      return null;
    } else {
      return true;
    }
  }

  @HostBinding('attr.aria-selected')
  get ariaSelected(): boolean {
    return this.selectable ? this.model.selected : null;
  }

  get ariaTreeNodeChildrenRole(): string {
    return this.model.children.length > 0 ? 'group' : null;
  }

  activateSelection(): void {
    if (this.treeSelectionService && !this.treeSelectionService.selectable) {
      this.treeSelectionService.selectable = true;
    }
  }

  /* Lifecycle */
  ngOnDestroy() {
    if (this.parent) {
      this.parent.unregister(this);
    }
  }
}
