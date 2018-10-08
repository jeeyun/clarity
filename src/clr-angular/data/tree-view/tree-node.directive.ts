/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { NgForOfContext } from '@angular/common';
import { TreeService } from './providers/tree.service';
import { ClrTreeChildrenFunction } from './interfaces/tree-children.interface';
import { ClrTreeNode } from '@clr/angular';

@Directive({ selector: '[clrNodes][clrNodesOf]' })
export class TreeNodesDirective<T = any> {
  private _nodes: T | T[];

  constructor(
    public template: TemplateRef<NgForOfContext<T>>,
    private viewContainer: ViewContainerRef,
    private treeService: TreeService
  ) {
    treeService.template = template;
  }

  @Input('clrNodesOf')
  public set nodes(nodes: T | T[]) {
    this._nodes = nodes ? nodes : [];
  }

  public get nodes() {
    return this._nodes;
  }

  @Input('clrNodesChildren')
  set children(loader: ClrTreeChildrenFunction<T>) {
    this.treeService.getChildren = loader;
  }

  public parent: ClrTreeNode<T>;

  // @Input('clrNodesParent')
  // set setParent(parent: ClrTreeNode<T>) {
  //   this.parent = parent;
  // }

  ngOnInit() {
    const nodeArray = Array.isArray(this._nodes) ? this._nodes : [this._nodes];
    for (const node of nodeArray) {
      this.viewContainer.createEmbeddedView(this.template, { $implicit: node });
    }
  }

  ngOnDestroy() {
    this.viewContainer.clear();
  }
}
