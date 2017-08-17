/*
 * Copyright (c) 2016-2017 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";

import {DatagridColumn} from "../datagrid-column";
import {DatagridHideableColumn} from "../datagrid-hideable-column";


/**
 * @class HideableColumnService
 *
 * @description
 * An @Injectable provider class that enables
 *
 * 1. Managing, track hideability of DatagridColumns
 *
 */
@Injectable()
export class HideableColumnService {
    /**********
     * @property dgHiddenColumnMap
     *
     * @description
     * An array of DatagridHideableColumn.
     * NOTE: because we can have columns w/o the *clrDgHideableColumn directive
     * this array will have empty spaces a.k.a nulls. This is needed to be able to map
     * DatagridCells to DatagridColumns in the RowRenderer.
     *
     *
     * @type { DatagridHideableColumn[] }
     */
    private _columnList: DatagridColumn[] = [];

    /**********
     *
     * @property dgHiddenColumnMapChange
     *
     * @description
     * A behavior subject that can broadcast updates to the column list.
     * NOTE: I am using BehaviorSubject because <clr-dg-column-toggle> is not getting the latest _columnListChange
     * on page load.
     *
     * @type {BehaviorSubject<DatagridColumn[]>}
     */
    private _columnListChange: BehaviorSubject<DatagridColumn[]> =
        new BehaviorSubject<DatagridColumn[]>(this._columnList);

    /**********
     *
     * @property canHideNextColumn
     *
     * @description
     * Service function that is called by clr-dg-column-toggle component. Use this if you need to ask if you can hide
     * a column. It acts as a guard against hiding all the columns making sure there is at least one column displayed.
     *
     * @returns {boolean}
     */
    public get canHideNextColumn(): boolean {
        const hiddenColumns = this._columnList.filter(column => column.hideable && column.hidden);
        return (this._columnList.length - hiddenColumns.length > 1);
    }

    /**********
     *
     * @property checkForAllColumnsVisible
     *
     * @description
     * For when you need to know if the datagrid's columns are all showing.
     *
     * @return {boolean}
     */
    public get checkForAllColumnsVisible(): boolean {
        return !this._columnList.some(column => column && column.hidden);
    }

    /***********
     * @property columnListChange
     *
     * @description
     * A public property that enables subscribers to hear updates to the column map.
     * Use this if you need to do something whenever the Datagrid's column list is changed (i.e *ngIf on a column).
     *
     * @returns {Observable<DatagridHideableColumn[]>}
     */
    public get columnListChange(): Observable<DatagridColumn[]> {
        return this._columnListChange.asObservable();
    }

    /**********
     *
     * @function getColumns
     *
     * @description
     * Public function that returns the current list of columns. I needed an array of to iterate on in the RowRenderer
     * but subscribing to the _columnListChange changes did not seem like the correct way to get it.
     *
     * @returns {DatagridColumn[]}
     */
    public getColumns(): DatagridColumn[] {
        return this._columnList;
    }

    public getHideableColumns(): DatagridHideableColumn[] {
        return this._columnList.map(column => column.hideable);
    }

    public getVisibleColumns(): DatagridColumn[] {
        return this._columnList.filter(column => !column.hidden);
    }

    /**********
     * @function showHiddenColumns
     *
     * @description
     * Iterate through the current _columnList:
     * - if it has a DatagridHideableColumn and is hidden then show it.
     * - if it's DatagridHideableColumn was previously the last column visible, turn that flag off.
     *
     */
    public showHiddenColumns() {
        this._columnList.forEach((column) => {
            if (column.hideable && column.hidden === true) {
                column.hideable.hidden = false;
            }

            if (column.hideable && column.hideable.lastVisibleColumn) {
                column.hideable.lastVisibleColumn = false;
            }
        });
    }

    /**
     * @function updateColumnList
     *
     * @param columns: DatagridColumn[]
     *
     * @description
     * Creates an array of DatagridHideableColumn's || null based column array passed as param.
     * Is dependent on the order in @ContentChildren in Datagrid.
     *
     * @param columns
     *
     */
    public updateColumnList(columns: DatagridColumn[]) {
        this._columnList = columns;                     // clear the list
        this.updateForLastVisibleColumn();              // Update our visibility state for UI
        this._columnListChange.next(this._columnList);  // Broadcast it
    }

    /**********
     *
     * @function updateForLastVisibleColumn
     *
     * @description
     * Gets the current visible count for all columns.
     * When it is greater than 1 it marks everything as false for the lastVisibleColumn.
     * When visible count is not > 1 (i.e) 1. , it finds the only column that is not hidden and marks it as the
     * lastVisibleColumn.
     *
     * @return void
     *
     */
    public updateForLastVisibleColumn(): void {
        // There is more than one column showing, make sure nothing is marked lastVisibleColumn
        if (this.canHideNextColumn) {
            this._columnList.map((column) => {
                if (column.hideable && column.hideable.lastVisibleColumn) {
                    column.hideable.lastVisibleColumn = false;
                }
            });
        } else {
            // The visibleCount is down to only one column showing. Find it and flag it as the lastVisibleColumn
            this._columnList.map((column) => {
                if (column.hideable && !column.hidden) {
                    column.hideable.lastVisibleColumn = true;
                }
            });
        }
    }

    /**********
     *
     * @function getColumnById
     *
     * @description
     * Return a HideableColumn in this._columnList for the given id.
     *
     * @param id
     *
     * @type string
     *
     * @returns HideableColumn
     *
     */
    public getColumnById(id: string): undefined|DatagridHideableColumn {
        if (id) {
            const columnWithId = this._columnList.find(column => column.hideable && column.hideable.id === id);
            if (columnWithId) {
                return columnWithId.hideable;
            }
        }
        return;
    }
}
