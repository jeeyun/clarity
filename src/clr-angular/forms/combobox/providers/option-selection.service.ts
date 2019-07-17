/*
 * Copyright (c) 2016-2019 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { ClrOption } from '../option';
import { MultiSelectComboboxModel } from '../model/multi-select-combobox.model';
import { SingleSelectComboboxModel } from '../model/single-select-combobox.model';

export type Selection<T> = SingleSelectComboboxModel<T> | MultiSelectComboboxModel<T>;

@Injectable()
export class OptionSelectionService<T> {
  public selection: Selection<T>;
  public currentOption: ClrOption<T>;
  public loading: boolean = false;
  public currentInput: string = '';

  private _selectionChanged: Subject<Selection<T>> = new Subject<Selection<T>>();

  // This observable is for notifying the ClrOption to update its
  // selection by comparing the value
  get selectionChanged(): Observable<Selection<T>> {
    return this._selectionChanged.asObservable();
  }

  setSelected(item: T, selected: boolean) {
    // if new item is null (or undefined) return
    if (!item) {
      return;
    }

    const oldValue = this.selection.model;

    this.selection.setSelected(item, selected);

    // only emit changes if the value actually changed
    if (this.selection.model !== oldValue) {
      this._selectionChanged.next(this.selection);
    }
  }

  get multi(): boolean {
    return this.selection instanceof MultiSelectComboboxModel;
  }

  // TODO: Add support for trackBy and compareFn
  setSelectionValue(value: T | T[]): void {
    // NOTE: Currently we assume that no 2 options will have the same value
    // but Eudes and I discussed that this is a possibility but we will handle
    // this later

    // if selection is undefined, or its value hasn't changed, or changing from null <-> undefined, that's not really changing so we return
    if (!this.selection || this.selection.model === value || (!this.selection.model && !value)) {
      return;
    }

    this.selection.model = value;
    this._selectionChanged.next(this.selection);
  }

  // private _renderSelectionChanged: Subject<ClrOption<T> | ClrOption<T>[]> = new Subject<
  //   ClrOption<T> | ClrOption<T>[]
  // >();
  //
  // // This observable is to notify the ClrCombobox component to render
  // // a new Option on the Input
  // get renderSelectionChanged(): Observable<ClrOption<T> | ClrOption<T>[]> {
  //   return this._renderSelectionChanged.asObservable();
  // }
  //
  // renderSelection(option: ClrOption<T>) {
  //   if (this.currentOption === option) {
  //     return;
  //   }
  //   this.currentOption = option;
  //   this._renderSelectionChanged.next(option);
  // }
}
