/**
 * Copyright (c) 2016-2019 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  Renderer2,
  ViewChild,
  ViewContainerRef,
  Injector,
  Self,
  Optional,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { POPOVER_HOST_ANCHOR } from '../../popover/common/popover-host-anchor.token';
import { IfOpenService } from '../../utils/conditional/if-open.service';

import { ClrOptions } from './options';
import { OptionSelectionService, Selection } from './providers/option-selection.service';
import { ComboboxDomAdapter } from './utils/combobox-dom-adapter.service';
import { ComboboxNoopDomAdapter } from './utils/combobox-noop-dom-adapter.service';
import { WrappedFormControl } from '../common/wrapped-control';
import { ClrComboboxContainer } from './combobox-container';
import { NgControl, ControlValueAccessor } from '@angular/forms';
import { ClrOptionSelected } from './option-selected.directive';
import { ClrCommonStringsService } from '../../utils/i18n/common-strings.service';
import { ClrLoadingState, LoadingListener } from '@clr/angular';
import { AriaService } from '../../utils/aria/aria.service';
import { IF_ACTIVE_ID_PROVIDER } from '../../utils/conditional/if-active.service';
import { MultiSelectComboboxModel } from './model/multi-select-combobox.model';
import { SingleSelectComboboxModel } from './model/single-select-combobox.model';
import { COMBOBOX_FOCUS_HANDLER_PROVIDER, ComboboxFocusHandler } from './providers/combobox-focus-handler.service';
import { FOCUS_SERVICE_PROVIDER } from '../../utils/focus/focus.service';
import { BACKSPACE } from '../../utils/key-codes/key-codes';

// Fixes build error
// @dynamic (https://github.com/angular/angular/issues/19698#issuecomment-338340211)
export function comboboxDomAdapterFactory(platformId: Object) {
  if (isPlatformBrowser(platformId)) {
    return new ComboboxDomAdapter();
  } else {
    return new ComboboxNoopDomAdapter();
  }
}

let nbComboboxComponents: number = 0;

@Component({
  selector: 'clr-combobox',
  template: `
    <div class="clr-combobox-container" [class.multi]="multiSelect" #comboboxContainer aria-live="polite">
      <!--<div id="foo" style="display: none;">Type and press the down arrow to browse available matches</div>-->
      <ng-container *ngIf="multiSelect">
        <!--used to describe the current selection when input receives focus-->
        <span [id]="ariaDescribedBySelection" class="clr-aria-only" *ngIf="optionSelectionService.selection.model">
            {{commonStrings.keys.selection + optionSelectionService.selection.toString(displayField)}}
          </span>
        
        <span *ngIf="optionSelectionService.selection.model">
          <span *ngFor="let item of optionSelectionService.selection.model; let i = index"
                class="label label-combobox-pill">
            <span tabindex="0" class="clr-combobox-pill-content">
              <ng-container *ngIf="optionSelected" [ngTemplateOutlet]="optionSelected.template"
                            [ngTemplateOutletContext]="{$implicit: optionSelectionService.selection.model[i]}">
              </ng-container>
            </span>
            <button type="button" class="clr-combobox-remove-btn" [disabled]="control?.disabled? true: null"
                    [attr.aria-label]="commonStrings.keys.delete + optionSelectionService.selection.toString(displayField, i)"
                    (click)="unselect(item)"><clr-icon shape="close" size="12"></clr-icon></button>
          </span>
        </span>
        <ng-container [ngTemplateOutlet]="textbox"></ng-container>

      </ng-container>

      <ng-container *ngIf="!multiSelect">
        <ng-container *ngIf="showCurrentSingleSelection && optionSelectionService.selection">

          <!--used to describe the current selection when input receives focus-->
          <span [id]="ariaDescribedBySelection" class="clr-aria-only" *ngIf="optionSelectionService.selection.model">
            {{commonStrings.keys.selection + optionSelectionService.selection.toString(displayField)}}
          </span>

          <span *ngIf="optionSelected" [ngTemplateOutlet]="optionSelected.template"
                [ngTemplateOutletContext]="{$implicit: optionSelectionService.selection.model}">
          </span>
          <span *ngIf="!optionSelected">{{optionSelectionService.selection.model}}</span>
        </ng-container>
        <ng-container [ngTemplateOutlet]="textbox"></ng-container>
      </ng-container>

      <button #trigger type="button" class="clr-combobox-trigger" tabindex="-1" (click)="toggleOptionsMenu($event)">
        <clr-icon shape="caret down" size="12"></clr-icon>
      </button>
    </div>

    <!-- Template for the textbox where the user types in. -->
    <ng-template #textbox>
      <span class="clr-combobox-input-wrapper" [class.clr-combobox-absolute-input-wrapper]="!multiSelect">
        <input type="text" class="clr-input clr-combobox-input" role="combobox" [id]="textboxId"
               [attr.aria-describedby]="ariaDescribedBySelection" [disabled]="control?.disabled? true: null"
               [attr.aria-expanded]="ifOpenService.open" aria-haspopup="listbox" [attr.aria-owns]="ariaOwns"
               [attr.aria-controls]="ariaControls" aria-multiline="false" aria-autocomplete="list" #textboxInput
               (focus)="onFocus()" (blur)="onBlur()" autocomplete="off"/>
      </span>
    </ng-template>

    <!-- Project content by the consumer, which should be a list of options -->
    <ng-content></ng-content>
    
  `,
  providers: [
    IfOpenService,
    { provide: POPOVER_HOST_ANCHOR, useExisting: ElementRef },
    OptionSelectionService,
    { provide: ComboboxDomAdapter, useFactory: comboboxDomAdapterFactory, deps: [PLATFORM_ID] },
    { provide: LoadingListener, useExisting: ClrCombobox },
    IF_ACTIVE_ID_PROVIDER,
    AriaService,
    FOCUS_SERVICE_PROVIDER,
    COMBOBOX_FOCUS_HANDLER_PROVIDER,
  ],
  host: {
    '[class.aria-required]': 'true',
    '[class.clr-combobox]': 'true',
    '[class.clr-combobox-disabled]': 'control?.disabled',
  },
})
export class ClrCombobox<T> extends WrappedFormControl<ClrComboboxContainer>
  implements ControlValueAccessor, LoadingListener {
  @ViewChild('comboboxContainer', { static: true })
  comboboxContainer: ElementRef;
  @ViewChild('textboxInput', { static: false })
  textbox: ElementRef;
  @ViewChild('trigger', { static: true })
  trigger: ElementRef;
  @ContentChild(ClrOptions, { static: false })
  optionz: ClrOptions<T>;
  @ContentChild(ClrOptionSelected, { static: false })
  optionSelected: ClrOptionSelected<T>;
  @Input('id') public comboboxId;
  public textboxId;

  /* reference to the enum so that template can access */
  public SELECTION_TYPE = Selection;

  public showCurrentSingleSelection: boolean = true;

  private onChangeCallback;

  private lastInputString: string = '';

  protected index: number = 1;

  constructor(
    vcr: ViewContainerRef,
    injector: Injector,
    @Self()
    @Optional()
    private control: NgControl,
    protected renderer: Renderer2,
    protected el: ElementRef,
    public ifOpenService: IfOpenService,
    public optionSelectionService: OptionSelectionService<T>,
    public cdr: ChangeDetectorRef,
    public commonStrings: ClrCommonStringsService,
    private domAdapter: ComboboxDomAdapter,
    private ariaService: AriaService,
    private focusHandler: ComboboxFocusHandler
  ) {
    super(vcr, ClrComboboxContainer, injector, control, renderer, el);
    if (control) {
      control.valueAccessor = this;
    }
    // default to SingleSelectComboboxModel, in case the optional input [ClrMulti] isn't used
    this.optionSelectionService.selection = new SingleSelectComboboxModel<T>();

    if (!this.comboboxId) {
      this.comboboxId = 'clr-combobox-' + nbComboboxComponents;
    }

    this.textboxId = 'clr-combobox-text-' + nbComboboxComponents;

    nbComboboxComponents += 1;

    this.initializeSubscriptions();
  }

  loadingStateChange(state: ClrLoadingState): void {
    this.optionSelectionService.loading = state === ClrLoadingState.LOADING;
  }

  writeValue(value: T | T[]): void {
    this.optionSelectionService.setSelectionValue(value);
  }

  private get disabled() {
    return this.control && this.control.disabled;
  }

  private unselect(item: T) {
    if (!this.disabled) {
      this.optionSelectionService.setSelected(item, false);
      this.focusHandler.focus();
    }
  }

  @Input('clrDisplayField') public displayField: string;

  ariaSelectionLabel(model: T | T[]) {
    let ariaSelectionLabel: string = '';

    if (model) {
      if (this.displayField && model[this.displayField]) {
        ariaSelectionLabel += model[this.displayField];
      } else {
        ariaSelectionLabel += model;
      }
    }

    return ariaSelectionLabel;
  }

  @Input('clrMulti')
  set multiSelect(value: boolean) {
    if (value) {
      this.optionSelectionService.selection = new MultiSelectComboboxModel<T>();
    } else {
      // in theory, setting this again should not cause errors even though we already set it in constructor,
      // since the initial call to writeValue (caused by [ngModel] input) should happen after this
      this.optionSelectionService.selection = new SingleSelectComboboxModel<T>();
    }
  }

  get multiSelect() {
    return this.optionSelectionService.multi;
  }

  get ariaControls(): string {
    return this.ariaService.ariaControls;
  }

  get ariaOwns(): string {
    return this.ariaService.ariaOwns;
  }

  get ariaDescribedBySelection(): string {
    return 'selection-' + this.comboboxId;
  }

  registerOnChange(onChange: any): void {
    this.onChangeCallback = onChange;
  }

  private onTouchedCallback = () => {
    if (this.control) {
      this.control.control.markAsTouched();
    }
  };

  registerOnTouched(onTouched: any): void {
    this.onTouchedCallback = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {}

  toggleOptionsMenu(event: any): void {
    if (!this.disabled) {
      this.ifOpenService.toggleWithEvent(event);
      this.onTouchedCallback();
    }
  }

  onFocus() {
    this.domAdapter.addFocusClass(this.comboboxContainer.nativeElement);
  }

  onBlur() {
    this.domAdapter.removeFocusClass(this.comboboxContainer.nativeElement);
    this.onTouchedCallback();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.showCurrentSingleSelection = !this.ifOpenService.open;
  }

  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    // if BACKSPACE in multiselect mode, delete the last pill if text is empty
    if (event.keyCode === BACKSPACE && this.multiSelect && this.lastInputString.length === 0) {
      this.optionSelectionService.selection.pop();
    }

    // if input text has changed since last time, fire a change event so application can react to it
    const currentText = this.textbox.nativeElement.value;
    if (currentText !== this.lastInputString) {
      this.clrInputChange.emit(currentText);
      this.optionSelectionService.currentInput = currentText;
      this.lastInputString = currentText;
    }
  }

  @Output('clrInputChange') public clrInputChange: EventEmitter<string> = new EventEmitter<string>(false);

  private initializeSubscriptions(): void {
    this.subscriptions.push(
      this.optionSelectionService.selectionChanged.subscribe((newSelection: Selection<T>) => {
        if (this.textbox) {
          this.writeValue(newSelection.model);
          // clear out any user-typed value upon selection
          if (this.textbox) {
            this.textbox.nativeElement.value = '';
          }
          this.showCurrentSingleSelection = true;
          // for the purposes of validation
          this.onChangeCallback(this.optionSelectionService.selection.model);
        }
      })
    );

    // this.subscriptions.push(
    //   this.optionSelectionService.renderSelectionChanged.subscribe((option: ClrOption<T>) => {
    //     this.renderSelection(option);
    //   })
    // );

    this.subscriptions.push(
      this.ifOpenService.openChange.subscribe(open => {
        if (!open) {
          if (this.textbox) {
            this.textbox.nativeElement.value = '';
          }
          this.showCurrentSingleSelection = true;
        }
      })
    );
  }

  // private renderSelection(selectedOption: ClrOption<T>): void {
  //   if (this.textbox.nativeElement && selectedOption) {
  //     // this.textbox.nativeElement.value = selectedOption.value;
  //     // this.textbox.nativeElement.style.width = 0;
  //     // this.domAdapter.clearChildren(this.input.nativeElement);
  //     // const clone: HTMLElement = this.domAdapter.cloneNode(selectedOption.elRef.nativeElement);
  //     // this.renderer.setAttribute(clone, 'contenteditable', 'false');
  //     // this.renderer.appendChild(this.input.nativeElement, clone);
  //   }
  // }

  // Lifecycle methods
  ngAfterViewInit() {
    this.focusHandler.textInput = this.textbox.nativeElement;
    this.focusHandler.trigger = this.trigger.nativeElement;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
