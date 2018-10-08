/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Component } from '@angular/core';
import { ClrTreeNodeModel } from '../../../../../clr-angular/data/tree-view/tree-node-model';

@Component({
  selector: 'clr-new-tree-view-poc-demo',
  styleUrls: ['../tree-view.demo.scss'],
  templateUrl: './new-tree-view-poc.html',
})
export class NewTreeNodePOCDemo {
  selectedA: boolean;
  selectedA1: boolean;
  selectedA2: boolean;
  selectedA3: boolean;
  selectedA4: boolean;
  selectedA31: boolean;
  selectedA32: boolean;
  selectedA33: boolean;

  aIndeterminate: boolean;
  a3Indeterminate: boolean;

  selectedC: boolean;
  selectedC1: boolean;
  selectedC2: boolean;
  selectedC3: boolean;
  selectedC4: boolean;
  selectedC31: boolean;
  selectedC32: boolean;
  selectedC33: boolean;

  cIndeterminate: boolean;
  c3Indeterminate: boolean;

  recursiveEagerTree;
  recursiveLazyTree;
  modelA: ClrTreeNodeModel = new ClrTreeNodeModel('A');
  modelA1: ClrTreeNodeModel = new ClrTreeNodeModel('A1');
  modelA2: ClrTreeNodeModel = new ClrTreeNodeModel('A2');
  modelA3: ClrTreeNodeModel = new ClrTreeNodeModel('A3');
  modelA4: ClrTreeNodeModel = new ClrTreeNodeModel('A4');
  modelA31: ClrTreeNodeModel = new ClrTreeNodeModel('A3-1');
  modelA32: ClrTreeNodeModel = new ClrTreeNodeModel('A3-2');
  modelA33: ClrTreeNodeModel = new ClrTreeNodeModel('A3-3');

  constructor() {
    this.modelA.indeterminate = true;

    this.recursiveEagerTree = {
      content: 'B',
      selectedVar: false,
      indetVar: true,
      expanded: true,
      children: [
        {
          content: 'B-1',
          selectedVar: false,
        },
        {
          content: 'B-2',
          selectedVar: true,
        },
        {
          content: 'B-3',
          selectedVar: false,
          indetVar: true,
          expanded: true,
          children: [
            {
              content: 'B-3-1',
              selectedVar: true,
            },
            {
              content: 'B-3-2',
              selectedVar: false,
            },
            {
              content: 'B-3-3',
              selectedVar: false,
            },
          ],
        },
        {
          content: 'B-4',
          selectedVar: false,
        },
      ],
    };

    this.recursiveLazyTree = {
      content: 'D',
      selectedVar: false,
      indetVar: false,
      expanded: false,
      children: [],
    };
  }

  loadStaticChildren(tree: any) {
    return tree.children;
  }

  doSomething(tree: any) {
    console.log(tree);
  }

  loadChildren(tree: any) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (tree.content.length > 6) {
          resolve([]);
        }

        const children = [];
        for (let i = 0; i < 3; i++) {
          children.push({
            content: `${tree.content}-${i}`,
            selectedVar: Math.floor(Math.random() * Math.floor(2)) === 0,
            indetVar: false,
            expanded: false,
          });
        }

        resolve(children);
      }, 2000);
    });
  }

  ngOnInit() {
    this.selectedA = false;
    this.selectedA1 = true;
    this.selectedA2 = true;
    this.selectedA3 = false;
    this.selectedA4 = false;
    this.selectedA31 = false;
    this.selectedA32 = false;
    this.selectedA33 = false;
    this.aIndeterminate = true;
    this.a3Indeterminate = false;

    this.selectedC = false;
    this.selectedC1 = true;
    this.selectedC2 = true;
    this.selectedC3 = false;
    this.selectedC4 = false;
    this.selectedC31 = false;
    this.selectedC32 = false;
    this.selectedC33 = false;
    this.cIndeterminate = true;
    this.c3Indeterminate = false;

    setTimeout(() => {
      this.selectedA31 = true;
      this.selectedC31 = true;
      this.c3Indeterminate = true;
    }, 0);
  }
}
