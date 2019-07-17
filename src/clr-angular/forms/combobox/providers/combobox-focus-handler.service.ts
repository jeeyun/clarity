/*
 * Copyright (c) 2016-2019 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, Renderer2 } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { IfOpenService } from '../../../utils/conditional/if-open.service';
import { customFocusableItemProvider } from '../../../utils/focus/focusable-item/custom-focusable-item-provider';
import { UNIQUE_ID } from '../../../utils/id-generator/id-generator.service';
import { ArrowKeyDirection } from '../../../utils/focus/arrow-key-direction.enum';
import { FocusService } from '../../../utils/focus/focus.service';
import { FocusableItem } from '../../../utils/focus/focusable-item/focusable-item';
import { linkVertical } from '../../../utils/focus/focusable-item/linkers';
import { wrapObservable } from '../../../utils/focus/wrap-observable';
import { BACKSPACE, DOWN_ARROW, ENTER, SHIFT, SPACE, TAB, UP_ARROW } from '../../../utils/key-codes/key-codes';

@Injectable()
export class ComboboxFocusHandler implements FocusableItem {
  constructor(
    @Inject(UNIQUE_ID) public id: string,
    private renderer: Renderer2,
    private ifOpenService: IfOpenService,
    private focusService: FocusService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.resetChildren();
    this.handleFocusOnClose();
  }

  private focusBackOnTextInput = false;

  /**
   * Focus back on the textInput when combobox becomes closed
   */
  handleFocusOnClose() {
    this.ifOpenService.openChange.subscribe(open => {
      if (!open) {
        // We reset the state of the focus service both on initialization and when closing.
        this.focusService.reset(this);
        // But we only actively focus the textInput when closing, not on initialization.
        if (this.focusBackOnTextInput) {
          this.textInput.focus();
        }
      }
      this.focusBackOnTextInput = open;
    });
  }

  private _trigger: HTMLElement;
  get trigger() {
    return this._trigger;
  }
  set trigger(el: HTMLElement) {
    this._trigger = el;
  }

  private _textInput: HTMLElement;
  get textInput() {
    return this._textInput;
  }
  set textInput(el: HTMLElement) {
    this._textInput = el;
    this.renderer.setAttribute(el, 'id', this.id);
    this.renderer.listen(el, 'keydown', event => !this.handleTextInput(event));
    this.renderer.listen(el, 'blur', event => {
      // event.relatedTarget is null in IE11. In that case we use document.activeElement
      // which points to the element that becomes active as the blur event occurs on the input.
      const target = event.relatedTarget || document.activeElement;

      if (target && isPlatformBrowser(this.platformId)) {
        // if for some reason the user clicks on the trigger while navigating with keyboard,
        // we mark it to move focus back on the input for later when it is closed.
        if (target === this.trigger) {
          this.focusBackOnTextInput = true;
          return;
        }
        // if we are focusing on something inside container keep it open
        if (this.container && this.container.contains(target)) {
          return;
        }
        // in browsers other than IE11, the target points to BODY
        // if we are focusing on something inside container
        if (target.tagName === 'BODY') {
          return;
        }
      }

      // we clear out any existing focus on the items
      this.children.pipe(take(1)).subscribe(items => items.forEach(item => item.blur()));

      // We let the user move focus to where the want, we don't force the focus back on the textInput
      this.focusBackOnTextInput = false;
      this.ifOpenService.open = false;
    });
  }

  private moveFocusTo(direction: ArrowKeyDirection) {
    setTimeout(() => {
      this.focusService.moveTo(this);
      this.focusService.move(direction);
      if (this.container && isPlatformBrowser(this.platformId)) {
        this.container.focus();
      }
    });
  }

  private openAndMoveTo(direction: ArrowKeyDirection) {
    if (!this.ifOpenService.open) {
      this.ifOpenService.openChange.pipe(take(1)).subscribe(open => {
        if (open) {
          this.moveFocusTo(direction);
        }
      });
      this.ifOpenService.open = true;
    } else {
      this.moveFocusTo(direction);
    }
  }

  // this service is only interested in keys that may move the focus
  private handleTextInput(event) {
    console.log('my combobox focus handler keydown');
    let preventDefault = false;
    if (event) {
      switch (event.keyCode) {
        case ENTER:
        case SPACE:
          if (!this.ifOpenService.open) {
            this.ifOpenService.open = true;
            preventDefault = true;
          }
          break;
        case UP_ARROW:
          event.preventDefault();
          event.stopImmediatePropagation();
          this.openAndMoveTo(ArrowKeyDirection.UP);
          preventDefault = true;
          break;
        case DOWN_ARROW:
          event.preventDefault();
          event.stopImmediatePropagation();
          this.openAndMoveTo(ArrowKeyDirection.DOWN);
          preventDefault = true;
          break;
        default:
          // Any other keypress
          console.log(event.keyCode);
          if (event.keyCode !== TAB && event.keyCode !== SHIFT && event.keyCode !== BACKSPACE) {
            this.ifOpenService.open = true;
          }
          break;
      }
    }
    return preventDefault;
  }

  private _container: HTMLElement;
  get container() {
    return this._container;
  }
  set container(el: HTMLElement) {
    this._container = el;
    this.focusService.registerContainer(el);
    // For combobox, the menu shouldn't actually be in the tab order. We manually focus it when opening.
    this.renderer.setAttribute(el, 'tabindex', '-1');
    // When the user moves focus outside of the menu, we close the combobox
    this.renderer.listen(el, 'blur', event => {
      // event.relatedTarget is null in IE11. In that case we use document.activeElement which correctly points
      // to the element we want to check. Note that other browsers might point document.activeElement to the
      // wrong element. This is ok, because all the other browsers we support relies on event.relatedTarget.
      const target = event.relatedTarget || document.activeElement;

      if (target && isPlatformBrowser(this.platformId)) {
        if (this.container.contains(target)) {
          return;
        }
      }

      // we clear out any existing focus on the items
      this.children.pipe(take(1)).subscribe(items => items.forEach(item => item.blur()));

      // We let the user move focus to where the want, we don't force the focus back on the textInput
      this.focusBackOnTextInput = false;
      this.ifOpenService.open = false;
    });
  }

  focus() {
    if (this.textInput && isPlatformBrowser(this.platformId)) {
      this.textInput.focus();
    }
  }
  blur() {
    if (this.textInput && isPlatformBrowser(this.platformId)) {
      this.textInput.blur();
    }
  }

  // activate() {
  //   if (isPlatformBrowser(this.platformId)) {
  //   }
  // }

  private children: ReplaySubject<FocusableItem[]>;
  right?: Observable<FocusableItem>;
  down?: Observable<FocusableItem>;
  up?: Observable<FocusableItem>;

  private openAndGetChildren() {
    return wrapObservable(this.children, () => (this.ifOpenService.open = true));
  }

  resetChildren() {
    this.children = new ReplaySubject<FocusableItem[]>(1);
    this.down = this.openAndGetChildren().pipe(map(all => all[0]));
    this.up = this.openAndGetChildren().pipe(map(all => all[all.length - 1]));
  }

  addChildren(children: FocusableItem[]) {
    linkVertical(children);
    this.children.next(children);
  }
}

export const COMBOBOX_FOCUS_HANDLER_PROVIDER = customFocusableItemProvider(ComboboxFocusHandler);
