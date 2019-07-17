/**
 * Copyright (c) 2016-2019 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { ComboboxModel } from './combobox.model';

export class MultiSelectComboboxModel<T> implements ComboboxModel<T> {
  model: T[];

  containsItem(item: T): boolean {
    // model might be undefined, in which case the first is false and second expression won't be evaluated
    return this.model && this.model.findIndex((itemInArray: T) => itemInArray === item) > -1;
  }

  setSelected(item: T, selected: boolean): void {
    if (selected) {
      this.addItem(item);
    } else {
      this.removeItem(item);
    }
  }

  pop(): T {
    let item;
    if (this.model && this.model.length > 0) {
      item = this.model[this.model.length - 1];
      this.removeItem(item);
    }
    return item;
  }

  toString(displayField?: string, index: number = -1): string {
    let displayString: string = '';

    if (this.model) {
      if (index > -1) {
        if (this.model[index]) {
          if (displayField && this.model[index][displayField]) {
            displayString += this.model[index][displayField];
          } else {
            displayString += this.model[index].toString();
          }
        }
      } else {
        this.model.forEach((model: T) => {
          if (displayField && model[displayField]) {
            displayString += model[displayField];
          } else {
            displayString = model.toString();
          }
        });
      }
    }

    return displayString;
  }

  private addItem(item) {
    if (!this.model) {
      this.model = [];
    }

    const index = this.model.indexOf(item);

    if (index === -1) {
      this.model.push(item);
    }
  }

  private removeItem(item) {
    if (this.model === null || this.model === undefined) {
      return;
    }

    const index = this.model.indexOf(item);

    if (index > -1) {
      this.model.splice(index, 1);
    }

    // we intentionally set the model to null for form validation
    if (this.model.length === 0) {
      this.model = null;
    }
  }
}
