/**
 * Copyright (c) 2016-2019 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { ComboboxModel } from './combobox.model';

export class SingleSelectComboboxModel<T> implements ComboboxModel<T> {
  model: T;

  containsItem(item: T): boolean {
    return this.model === item;
  }

  setSelected(item: T, selected: boolean): void {
    if (selected) {
      this.model = item;
    } else {
      this.model = null;
    }
  }

  pop(): T {
    const item = this.model;
    this.model = null;
    return item;
  }

  toString(displayField?: string, index?: number): string {
    if (displayField && this.model[displayField]) {
      return this.model[displayField];
    } else {
      return this.model.toString();
    }
  }
}
