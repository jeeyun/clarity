export class ClrTreeNodeModel<T = any> {
  _selected: boolean;
  _indeterminate: boolean;
  disabled: boolean;
  model: T;
  parent: ClrTreeNodeModel<T>;
  children: ClrTreeNodeModel<T>[] = [];

  constructor(model: T) {
    this.model = model;
  }

  public set selected(value: boolean) {
    const oldValue = this.selected;
    this._selected = value;
    if (this._selected) {
      this.indeterminate = false;
    }

    if (true) {
      // TODO: isLazyTree()
      console.log(this.children);
      this.children.forEach(child => child.updateBasedOnParent());

      if (this.parent) {
        setTimeout(() => {
          this.parent.updateBasedOnChildren();
        }, 0);
      }
    }
  }

  public get selected() {
    return this._selected;
  }

  public set indeterminate(value: boolean) {
    const oldValue = this._indeterminate;
    value = !!value;
    this._indeterminate = value;
    if (this._indeterminate) {
      this.selected = false;
    }
    // if (oldValue !== this._selected) {
    //   this.selectedChanged();
    // }
  }

  public get indeterminate() {
    return this._indeterminate;
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

    // if (this.selected !== previousSelectedValue) {
    //   this.selectedChanged();
    // }
    //
    // if (this.indeterminate !== previousIndeterminateValue) {
    //   this.indeterminateChanged();
    // }

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

      // if (this.selected !== previousSelectedValue) {
      //   this.selectedChanged();
      // }
      //
      // if (this.indeterminate !== previousIndeterminateValue) {
      //   this.indeterminateChanged();
      // }
    }
  }
}
