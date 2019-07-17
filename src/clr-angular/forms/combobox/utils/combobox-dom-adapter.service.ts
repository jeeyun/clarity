/**
 * Copyright (c) 2016-2019 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Injectable } from '@angular/core';

@Injectable()
export class ComboboxDomAdapter {
  clearChildren(element: any): void {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  click(element: any): void {
    element.click();
  }

  focus(element: any): void {
    element.focus();
  }

  addFocusClass(element: any): void {
    element.classList.add('clr-focus');
  }

  removeFocusClass(element: any): void {
    element.classList.remove('clr-focus');
  }
}
