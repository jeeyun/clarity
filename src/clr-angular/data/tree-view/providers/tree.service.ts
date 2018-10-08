/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Injectable, TemplateRef } from '@angular/core';
import { ClrTreeChildrenFunction } from '../interfaces/tree-children.interface';

@Injectable()
export class TreeService<T = any> {
  template: TemplateRef<T>;
  getChildren: ClrTreeChildrenFunction<T>;
  lazyload: boolean = false;
}
