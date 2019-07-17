/**
 * Copyright (c) 2016-2019 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Component, ElementRef, HostBinding, HostListener, Inject, Input, OnDestroy, Optional } from '@angular/core';
import { Subscription } from 'rxjs';

import { POPOVER_HOST_ANCHOR } from '../../popover/common/popover-host-anchor.token';
import { IfOpenService } from '../../utils/conditional/if-open.service';

import { OptionSelectionService } from './providers/option-selection.service';
import { Selection } from './providers/option-selection.service';
import { ENTER, SPACE } from '../../utils/key-codes/key-codes';
import { SingleSelectComboboxModel } from './model/single-select-combobox.model';
import { MultiSelectComboboxModel } from './model/multi-select-combobox.model';
import { FocusableItem } from '../../utils/focus/focusable-item/focusable-item';
import { BASIC_FOCUSABLE_ITEM_PROVIDER } from '../../utils/focus/focusable-item/basic-focusable-item.service';
@Component({
  selector: 'clr-option',
  template: `
    <ng-content></ng-content>
  `,
  host: {
    '[class.clr-option]': 'true',
    '[attr.role]': '"option"',
    '[attr.aria-selected]': 'selected',
  },
  providers: [BASIC_FOCUSABLE_ITEM_PROVIDER],
})
export class ClrOption<T> implements OnDestroy {
  private subscription: Subscription;

  _selected: boolean = false;

  @Input('clrValue') value: T;

  set selected(val: boolean) {
    this._selected = !!val;
  }

  @HostBinding('class.active')
  get selected() {
    return this._selected;
  }

  @Input()
  set disabled(value: boolean | string) {
    // Empty string attribute evaluates to false but should disable the item, so we need to add a special case for it.
    this.focusableItem.disabled = !!value || value === '';
  }

  constructor(
    private ifOpenService: IfOpenService,
    @Optional()
    @Inject(POPOVER_HOST_ANCHOR)
    parentHost: ElementRef,
    public elRef: ElementRef,
    private optionSelectionService: OptionSelectionService<T>,
    private focusableItem: FocusableItem
  ) {
    if (!parentHost) {
      throw new Error('clr-option should only be used inside of a clr-combobox');
    }
    this.initializeSubscription();
  }

  private initializeSubscription(): void {
    this.subscription = this.optionSelectionService.selectionChanged.subscribe((value: Selection<T>) => {
      // I think we can just use the latest current in the updatedSelected method instead of using this value; verify
      this.updateSelected();
    });
  }

  private updateSelected() {
    const selection = this.optionSelectionService.selection;
    // Check for null and undefined needed because if the user doesn't assign a value to the option,
    // all options should not be selected as the value would be null or undefined
    if (selection.model === null || selection.model === undefined) {
      this.selected = false;
      return;
    }

    this.selected = selection.containsItem(this.value);
  }

  /**
   * This behavior is only for single select. Multi select will keep the menu open on option click.
   * We will handle that later.
   */
  @HostListener('click')
  onClick() {
    // We call render here without checking the value because even if the user hasn't
    // assigned a value to the option, we should at least display the selection on the input.
    // This is what the native select does.
    this.optionSelectionService.setSelected(this.value, true);
    // this.optionSelectionService.renderSelection(this);
    this.updateSelected();

    this.ifOpenService.open = false;
    // if (!this.optionSelectionService.multi) {
    //   this.ifOpenService.open = false;
    // }
  }

  // Lifecycle Methods
  ngAfterContentInit(): void {
    // A parent container/element may have set the current before this option is initialized.
    // In this case, we want to update the selected state of this option element accordingly.
    this.updateSelected();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
