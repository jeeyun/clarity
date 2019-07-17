/**
 * Copyright (c) 2016-2019 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component, OnDestroy, Optional, ContentChild, forwardRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgControl } from '@angular/forms';

import { IfErrorService } from '../common/if-error/if-error.service';
import { NgControlService } from '../common/providers/ng-control.service';
import { ControlIdService } from '../common/providers/control-id.service';
import { ControlClassService } from '../common/providers/control-class.service';
import { DynamicWrapper } from '../../utils/host-wrapping/dynamic-wrapper';
import { LayoutService } from '../common/providers/layout.service';
import { ClrLabel } from '../common/label';
import { ClrCombobox } from './combobox';

@Component({
  selector: 'clr-combobox-container',
  template: `
    <ng-content select="label"></ng-content>
    <label *ngIf="!label && addGrid()"></label>
    <div class="clr-control-container" [ngClass]="controlClass()">
      <ng-content select="clr-combobox"></ng-content>
      <clr-icon *ngIf="invalid" class="clr-validate-icon" shape="exclamation-circle" aria-hidden="true"></clr-icon>
      <ng-content select="clr-control-helper" *ngIf="!invalid"></ng-content>
      <ng-content select="clr-control-error" *ngIf="invalid"></ng-content>
    </div>
  `,
  host: {
    '[class.clr-form-control]': 'true',
    '[class.clr-form-control-disabled]': 'control?.disabled',
    '[class.clr-row]': 'addGrid()',
  },
  providers: [IfErrorService, NgControlService, ControlIdService, ControlClassService],
})
export class ClrComboboxContainer implements DynamicWrapper, OnDestroy {
  private subscriptions: Subscription[] = [];
  @ContentChild(ClrLabel, { static: false })
  label: ClrLabel;
  @ContentChild(forwardRef(() => ClrCombobox), { static: false })
  combobox: ClrCombobox<any>;

  invalid = false;
  _dynamic = false;
  control: NgControl;

  constructor(
    private ifErrorService: IfErrorService,
    @Optional() private layoutService: LayoutService,
    private controlClassService: ControlClassService,
    private ngControlService: NgControlService
  ) {
    this.subscriptions.push(
      this.ifErrorService.statusChanges.subscribe(invalid => {
        this.invalid = invalid;
      })
    );
    this.subscriptions.push(
      this.ngControlService.controlChanges.subscribe(control => {
        this.control = control;
      })
    );
  }

  controlClass() {
    return this.controlClassService.controlClass(this.invalid, this.addGrid());
  }

  addGrid() {
    if (this.layoutService && !this.layoutService.isVertical()) {
      return true;
    }
    return false;
  }

  ngAfterContentInit() {
    if (this.label && this.combobox) {
      this.label.forAttr = this.combobox.textboxId;
    }
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.map(sub => sub.unsubscribe());
    }
  }
}
