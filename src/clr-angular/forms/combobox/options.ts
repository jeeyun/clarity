/**
 * Copyright (c) 2016-2019 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import {
  Component,
  ContentChildren,
  ElementRef,
  Inject,
  Injector,
  Input,
  OnDestroy,
  Optional,
  QueryList,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { AbstractPopover } from '../../popover/common/abstract-popover';
import { Point } from '../../popover/common/popover';
import { POPOVER_HOST_ANCHOR } from '../../popover/common/popover-host-anchor.token';
import { OptionSelectionService } from './providers/option-selection.service';
import { IF_ACTIVE_ID } from '../../utils/conditional/if-active.service';
import { AriaService } from '../../utils/aria/aria.service';
import { ComboboxFocusHandler } from './providers/combobox-focus-handler.service';
import { FocusableItem } from '../../utils/focus/focusable-item/focusable-item';
import { ClrCommonStringsService } from '../../utils/i18n/common-strings.service';
import { ClrLoadingState, LoadingListener } from '@clr/angular';

let nbOptionsComponents: number = 0;

@Component({
  selector: 'clr-options',
  template: `
    <div *ngIf="optionSelectionService.loading" class="clr-options-loading">
      <span class="spinner spinner-inline">
          Loading...
      </span>
      <span class="clr-options-text">
          {{searchText(optionSelectionService.currentInput)}}
      </span>
    </div>
    
    <!-- Rendered if data set is empty -->
    <div *ngIf="emptyOptions">
      <span class="clr-options-empty-text">
        No results
      </span>
    </div>
    
    <!--Option Groups and Options will be projected here-->
    <ng-content></ng-content>
  `,
  providers: [{ provide: LoadingListener, useExisting: ClrOptions }],
  host: {
    '[class.clr-options]': 'true',
    '[attr.aria-multiselectable]': 'optionSelectionService.multi',
    '[attr.role]': '"listbox"',
    '[id]': 'optionsId',
  },
})
export class ClrOptions<T> extends AbstractPopover implements LoadingListener, OnDestroy {
  private sub: Subscription;

  public loading: boolean = false;

  constructor(
    public optionSelectionService: OptionSelectionService<T>,
    @Inject(IF_ACTIVE_ID) public id: number,
    private ariaService: AriaService,
    private focusHandler: ComboboxFocusHandler,
    public commonStrings: ClrCommonStringsService,
    injector: Injector,
    @Optional()
    @Inject(POPOVER_HOST_ANCHOR)
    parentHost: ElementRef
  ) {
    super(injector, parentHost);

    if (!parentHost) {
      throw new Error('clr-options should only be used inside of a clr-combobox');
    }

    // Configure Popover
    this.initializeSubscriptions();
    this.configurePopover();

    if (!this.optionsId) {
      this.optionsId = 'clr-options-' + nbOptionsComponents++;
    }
  }

  public searchText(input: string) {
    return this.commonStrings.parse(this.commonStrings.keys.searching, { INPUT: input });
  }

  /**
   * Tests if the list of options is empty, meaning it doesn't contain any items
   */
  public get emptyOptions() {
    return !this.optionSelectionService.loading && this.items.length === 0;
  }

  /**
   * Configure Popover Direction and Close indicators
   */
  private configurePopover(): void {
    this.anchorPoint = Point.BOTTOM_LEFT;
    this.popoverPoint = Point.LEFT_TOP;
    // This is an unfortunate offset I need to add to position the popover correctly below
    // the combobox. This logic will go away once we switch to smart popover.
    this.popoverOptions = { offsetY: this.optionSelectionService.multi ? 8 : 6 };
    this.closeOnOutsideClick = true;
  }

  private initializeSubscriptions(): void {
    this.sub = this.ifOpenService.ignoredElementChange.subscribe((el: ElementRef) => {
      if (el) {
        this.ignoredElement = el.nativeElement;
      }
      this.sub.unsubscribe();
    });
  }

  @Input('id')
  set optionsId(id: string) {
    this.ariaService.ariaControls = id;
    this.ariaService.ariaOwns = id;
  }

  get optionsId(): string {
    return this.ariaService.ariaControls;
  }

  @ContentChildren(FocusableItem) items: QueryList<FocusableItem>;

  ngAfterContentInit() {
    this.focusHandler.container = this.el.nativeElement;
    this.items.changes.subscribe(() => {
      this.focusHandler.addChildren(this.items.toArray());
    });
    // I saw this on GitHub as a solution to avoid code duplication because of missed QueryList changes
    this.items.notifyOnChanges();
  }

  // Lifecycle hooks
  ngOnDestroy() {
    super.ngOnDestroy();

    if (!this.sub.closed) {
      this.sub.unsubscribe();
    }

    this.focusHandler.resetChildren();
  }

  loadingStateChange(state: ClrLoadingState): void {
    this.loading = state === ClrLoadingState.LOADING;
  }
}
