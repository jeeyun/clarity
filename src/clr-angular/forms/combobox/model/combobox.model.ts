/**
 * Copyright (c) 2016-2019 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

export abstract class ComboboxModel<T> {
  model: T | T[];
  abstract containsItem(item: T): boolean;
  abstract setSelected(item: T, selected: boolean): void;
  abstract toString(displayField?: string, index?: number): string;
  abstract pop(): T; // pops the last item
}
