/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component, Input } from '@angular/core';
import { TreeService } from './providers/tree.service';

@Component({
  selector: 'clr-tree',
  template: '<ng-content></ng-content>',
  providers: [TreeService],
})
export class ClrTree<T = any> {
  constructor(public treeService: TreeService) {}

  get lazyload() {
    return this.treeService.lazyload;
  }

  @Input('clrLazyload')
  set lazyload(value: boolean) {
    this.treeService.lazyload = !!value;
  }
}
