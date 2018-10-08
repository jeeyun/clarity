/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

export abstract class AbstractTreeSelection {
  constructor(public parent: AbstractTreeSelection) {}

  abstract get children(): AbstractTreeSelection[];
  abstract get isLazyTree(): boolean;

  abstract selectedChanged(): void;
  abstract indeterminateChanged(): void;

  private _disabled: boolean = false;
  private _selected: boolean = false;
  private _indeterminate: boolean = false;

  public get disabled(): boolean {
    return this._disabled;
  }

  public set disabled(value: boolean) {
    this._disabled = !!value;
  }

  public get selected(): boolean {
    return this._selected;
  }

  public set selected(value: boolean) {
    const oldValue = this._selected;
    this._selected = value;
    if (this._selected) {
      this.indeterminate = false;
    }
    if (oldValue !== this._selected) {
      this.selectedChanged();
    }
    if (!this.isLazyTree) {
      // console.log('not lazy tree', this.children);
      this.children.forEach(child => child.updateBasedOnParent());

      if (this.parent) {
        setTimeout(() => {
          this.parent.updateBasedOnChildren();
        }, 0);
      }
    }
  }

  public get indeterminate(): boolean {
    return this._indeterminate;
  }

  public set indeterminate(value: boolean) {
    const oldValue = this._indeterminate;
    value = !!value;
    this._indeterminate = value;
    if (this._indeterminate) {
      this.selected = false;
    }
    if (oldValue !== this._indeterminate) {
      this.indeterminateChanged();
    }
  }

  updateBasedOnChildren() {
    const previousSelectedValue: boolean = this._selected;
    const previousIndeterminateValue: boolean = this._indeterminate;
    let indeterminateChildCount = 0;
    let selectedChildCount = 0;
    let unselectedChildCount = 0;

    for (const child of this.children) {
      if (child.selected && !child.indeterminate) {
        selectedChildCount++;
      }
      if (!child.selected && child.indeterminate) {
        indeterminateChildCount++;
      }
      if (!child.selected && !child.indeterminate) {
        unselectedChildCount++;
      }
    }

    // if all children are selected, then the current node is selected too
    this._selected = selectedChildCount === this.children.length;

    // if there's at least one indeterminate child, or if it has both selected and unselected children, then the current node is indeterminate
    this._indeterminate = indeterminateChildCount > 0 || (selectedChildCount > 0 && unselectedChildCount > 0);

    if (this.selected !== previousSelectedValue) {
      this.selectedChanged();
    }

    if (this.indeterminate !== previousIndeterminateValue) {
      this.indeterminateChanged();
    }

    if (
      this.parent &&
      (this._selected !== previousSelectedValue || this._indeterminate !== previousIndeterminateValue)
    ) {
      this.parent.updateBasedOnChildren();
    }
  }

  updateBasedOnParent() {
    if (this.parent) {
      const previousSelectedValue: boolean = this._selected;
      const previousIndeterminateValue: boolean = this._indeterminate;

      if (this.parent.selected && !this.selected) {
        this.selected = true;
        this.indeterminate = false;
        this.children.forEach(child => child.updateBasedOnParent());
      }
      if (!this.parent.selected && !this.parent.indeterminate && (this.selected || this.indeterminate)) {
        this.selected = false;
        this.indeterminate = false;
        this.children.forEach(child => child.updateBasedOnParent());
      }

      if (this.selected !== previousSelectedValue) {
        this.selectedChanged();
      }

      if (this.indeterminate !== previousIndeterminateValue) {
        this.indeterminateChanged();
      }
    }
  }
}
