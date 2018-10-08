/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnDestroy,
  Optional,
  Output,
  QueryList,
  SkipSelf,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { Expand } from '../../utils/expand/providers/expand';
import { UNIQUE_ID, UNIQUE_ID_PROVIDER } from '../../utils/id-generator/id-generator.service';
import { LoadingListener } from '../../utils/loading/loading-listener';

import { AbstractTreeSelection } from './abstract-tree-selection';
import { clrTreeSelectionProviderFactory } from './providers/tree-selection.provider';
import { TreeSelectionService } from './providers/tree-selection.service';
import { TreeService } from './providers/tree.service';
import { ClrCommonStrings } from '../../utils/i18n/common-strings.interface';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'clr-tree-node',
  templateUrl: './tree-node.html',
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
export class ClrTreeNode<T = any> extends AbstractTreeSelection implements OnDestroy {
  @ViewChild('childNodesContainer', { read: ViewContainerRef })
  childNodesContainer: ViewContainerRef;
  @Input('clrNodeModel') model: T;

  constructor(
    public nodeExpand: Expand,
    @Optional()
    @SkipSelf()
    public parent: ClrTreeNode,
    public treeSelectionService: TreeSelectionService,
    @Inject(UNIQUE_ID) public nodeId: string,
    public commonStrings: ClrCommonStrings,
    private cdr: ChangeDetectorRef,
    public treeService: TreeService
  ) {
    super(parent);
    if (this.parent) {
      this.parent.register(this);
    }

    this.subscriptions.push(
      nodeExpand.expandChange.subscribe(expanded => {
        if (this.isLazyTree) {
          if (expanded) {
            this.createDynamicChildren();
          } else {
            this.childNodesContainer.clear();
          }
        }
      })
    );
  }

  private _children: ClrTreeNode[] = [];
  private subscriptions: Subscription[] = [];
  private hideExpand: boolean = false;

  get children(): ClrTreeNode[] {
    return this._children;
  }

  get isLazyTree(): boolean {
    return this.treeService.lazyload;
  }

  /* Registration */
  // TODO: This should ideally be in AbstractTreeSelection
  // Tried doing this but ran into some issues and also ran out of time.
  // Will get this done later.
  register(childNode: ClrTreeNode): void {
    if (this.children.indexOf(childNode) === -1) {
      this.children.push(childNode);
    }
  }

  // TODO: This should ideally be in AbstractTreeSelection
  // Tried doing this but ran into some issues and also ran out of time.
  // Will get this done later.
  unregister(childNode: ClrTreeNode): void {
    const index = this.children.indexOf(childNode);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }

  /* Selection */

  activateSelection(): void {
    if (this.treeSelectionService && !this.treeSelectionService.selectable) {
      this.treeSelectionService.selectable = true;
    }
  }

  @Input('clrSelected')
  public set nodeSelected(value: boolean) {
    // required for recursive trees to discard unset inputs.
    this.activateSelection();
    if (value === undefined || value === null) {
      return;
    }
    this.selected = value;
  }

  @Output('clrSelectedChange') nodeSelectedChange: EventEmitter<boolean> = new EventEmitter<boolean>(true);

  selectedChanged(): void {
    this.cdr.markForCheck();
    this.nodeSelectedChange.emit(this.selected);
  }

  get selectable(): boolean {
    if (this.treeSelectionService) {
      return this.treeSelectionService.selectable;
    }
    return false;
  }

  @Input('clrDisabled')
  set nodeDisabled(value: boolean) {
    this.activateSelection();
    if (value === undefined || value === null) {
      return;
    }
    this.disabled = value;
  }

  @Input('clrIndeterminate')
  set nodeIndeterminate(value: boolean) {
    this.activateSelection();
    if (value === undefined || value === null) {
      return;
    }
    this.indeterminate = value;
  }

  @Output('clrIndeterminateChange') nodeIndeterminateChanged: EventEmitter<boolean> = new EventEmitter<boolean>(true);

  indeterminateChanged(): void {
    this.cdr.markForCheck();
    this.nodeIndeterminateChanged.emit(this.indeterminate);
  }

  /* Expansion */

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
    return this.parent ? 'treeitem' : 'tree';
  }

  @HostBinding('attr.aria-multiselectable')
  get rootAriaMultiSelectable(): boolean {
    if (this.parent || !this.selectable) {
      return null;
    } else {
      return true;
    }
  }

  @HostBinding('attr.aria-selected')
  get ariaSelected(): boolean {
    return this.selectable ? this.selected : null;
  }

  get ariaTreeNodeChildrenRole(): string {
    return this.children.length > 0 ? 'group' : null;
  }

  /* Lifecycle */
  ngOnDestroy() {
    if (this.parent) {
      this.parent.unregister(this);
    }

    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  private createDynamicChildren() {
    if (this.treeService.getChildren) {
      this.nodeExpand.loading = true; // only for lazy
      const getChildrenFunction = this.treeService.getChildren(this.model);

      if (getChildrenFunction instanceof Promise) {
        getChildrenFunction.then(children => {
          this.createChildrenNodes(children);
        });
      } else if (getChildrenFunction instanceof Observable) {
        this.subscriptions.push(
          getChildrenFunction.subscribe(children => {
            this.createChildrenNodes(children);
          })
        );
      } else {
        this.createChildrenNodes(getChildrenFunction);
      }
    }
  }

  private createChildrenNodes(children: Array<T>) {
    if (children && children.length > 0) {
      for (const child of children) {
        this.childNodesContainer.createEmbeddedView(this.treeService.template, { $implicit: child, parent: this });
      }
    } else {
      this.hideExpand = true;
    }

    setTimeout(() => {
      this.nodeExpand.loading = false;
      this.cdr.markForCheck();
    }, 0);
  }

  ngOnInit() {
    if (!this.isLazyTree) {
      this.createDynamicChildren();
    }
  }

  @ContentChildren(ClrTreeNode) recursiveChildren: QueryList<ClrTreeNode>;

  ngAfterContentInit() {
    const node = this.recursiveChildren.first;
    console.log(node);
    // const context = node.childNodesContainer.injector.view.parent.context;
    // if (context && context.parent) {
    //   node.parent = context.parent;
    //   node.parent.register(node);
    // }
  }
}
