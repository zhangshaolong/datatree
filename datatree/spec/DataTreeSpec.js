/**
 *  @file 针对DataTree的测试
 *  @author Zhang Shaolong(zhangshaolong@baidu.com)
 */
(function (root, factory) {
    var dataTreeTest = factory();
    if (typeof define === 'function') {
        define(function() {
            return dataTreeTest;
        });
    } else {
        root.DataTreeTest = dataTreeTest;
    }
})(this, function () {
    describe("DataTreeTest", function() {
        var dataTree;
        var mockData;
        beforeEach(function() {
            dataTree = new DataTree();
            mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外'},
                {id: 3, text: '华北地区', pid: 1},
                {id: 4, text: '东北地区', pid: 1},
                {id: 5, text: '华东地区', pid: 1},
                {id: 6, text: '华中地区', pid: 1},
                {id: 7, text: '华南地区', pid: 1},
                {id: 8, text: '西南地区', pid: 1},
                {id: 9, text: '西北地区', pid: 1},
                {id: 10, text: '其他地区', pid: 1},
                {id: 11, text: '日本', pid: 2},
                {id: 12, text: '北京', pid: 3},
                {id: 13, text: '天津', pid: 3},
                {id: 14, text: '河北', pid: 3},
                {id: 15, text: '内蒙古', pid: 3},
                {id: 16, text: '山西', pid: 3},
                {id: 17, text: '上海', pid: 5},
                {id: 18, text: '福建', pid: 5},
                {id: 19, text: '江苏', pid: 5},
                {id: 20, text: '江西', pid: 5},
                {id: 21, text: '浙江', pid: 5},
                {id: 22, text: '福州', pid: 18},
                {id: 23, text: '宁德', pid: 18},
                {id: 24, text: '三明', pid: 18},
                {id: 25, text: '厦门', pid: 18},
                {id: 26, text: '龙城', pid: 18}
            ];
        });
    
        it("测试未载入数据的时候，获取根节点数据的情况", function() {
            expect(dataTree.indexRelation[DataTree.ROOT_KEY]).toBeUndefined();
        });
    
        it("测试载入数据后，获取根节点数据的情况", function() {
            dataTree.load(mockData);
            expect(dataTree.indexRelation[DataTree.ROOT_KEY].child)
                .toEqual([1, 2]);
        });
    
        it("测试载入数据后，通过子节点获取父节点的情况", function() {
            dataTree.load(mockData);
            var child = dataTree.indexRelation[DataTree.ROOT_KEY].child;
            expect(String(dataTree.indexRelation[child[0]].pid))
                .toEqual(DataTree.ROOT_KEY);
        });
    
        it("测试载入数据后，判断节点的父子关系，参数是父子关系的情况",
            function() {
            dataTree.load(mockData);
            var child = dataTree.indexRelation[DataTree.ROOT_KEY].child;
            expect(dataTree.isDescendant(DataTree.ROOT_KEY, child[0])).toBeTruthy();
        });
          
        it("测试载入数据后，判断节点的父子关系，参数兄弟关系的情况",
            function() {
            dataTree.load(mockData);
            var child = dataTree.indexRelation[DataTree.ROOT_KEY].child;
            expect(dataTree.isDescendant(child[0], child[1])).toBeFalsy();
        });
          
        it("测试载入数据后，判断节点的父子关系，参数是子父关系的情况",
            function() {
            dataTree.load(mockData);
            var child = dataTree.indexRelation[DataTree.ROOT_KEY].child;
            expect(dataTree.isDescendant(child[0], DataTree.ROOT_KEY)).toBeFalsy();
        });
    
        it("测试载入数据后，判断节点的父子关系，参数是自己的情况", function() {
            dataTree.load(mockData);
            var child = dataTree.indexRelation[DataTree.ROOT_KEY].child;
            expect(dataTree.isDescendant(child[0], child[0])).toBeFalsy();
        });
    
        it("测试载入数据后，为数据设置值，并进行获取值测试，"
            + "只获取最高级选中数据的情况", function() {
            dataTree.load(mockData);
            dataTree.setValue(1);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([1]);
        });
          
        it("测试载入数据后，为数据设置值，并进行获取值测试，"
            + "只获取选中叶子节点数据的情况", function() {
            dataTree.load(mockData);
            dataTree.setValue(1);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyLeaf))
                .toEqual([12, 13, 14, 15, 16, 4, 17, 22, 23, 24, 25, 26,
                19, 20, 21, 6, 7, 8, 9, 10]);
        });
          
        it("测试载入数据后，为数据设置值，并进行获取值测试，"
            + "取选所以选中节点数据的情况", function() {
            dataTree.load(mockData);
            dataTree.setValue(1);
            expect(dataTree.getValue())
                .toEqual([1, 3, 12, 13, 14, 15, 16, 4, 5, 17, 18, 22, 23, 24,
                25, 26, 19, 20, 21, 6, 7, 8, 9, 10]);
        });
          
        it("测试载入数据后，只设置部分孩子节点是选中时，"
            + "判断当前节点是否问半选状态", function() {
            dataTree.load(mockData);
            dataTree.setValue(1);
            expect(dataTree.isHalf(DataTree.ROOT_KEY)).toBeTruthy();
        });
          
        it("测试载入数据后，设置全部孩子节点是选中时，"
            + "判断当前节点是否问半选状态", function() {
            dataTree.load(mockData);
            dataTree.setValue([1, 2]);
            expect(dataTree.isHalf(DataTree.ROOT_KEY)).toBeFalsy();
        });
          
        it("测试载入数据后，设置全部孩子节点都不选中时，"
            + "判断当前节点是否问半选状态", function() {
            dataTree.load(mockData);
            dataTree.setValue();
            expect(dataTree.isHalf(DataTree.ROOT_KEY)).toBeFalsy();
        });
          
        it("测试载入数据后，设置当前层级所有节点是半选状态，"
            + "判断父级节点是否问半选状态", function() {
            var mockData = [
                {id: 1, text: '父级节点'},
                {id: 2, text: '当前级节点1', pid: 1},
                {id: 3, text: '下级节点1', pid: 2},
                {id: 4, text: '下级节点2', pid: 2},
                {id: 5, text: '当前级节点2', pid: 1},
                {id: 6, text: '下级节点3', pid: 5},
                {id: 7, text: '下级节点4', pid: 5}
            ];
            dataTree.load(mockData);
            dataTree.setValue([4, 7]);
            expect(dataTree.isHalf(1)).toBeTruthy();
        });
    
        it("测试载入数据后，设置当前节点为半选状态且父级只有当前节点一个子级，"
            + "判断父级节点是否问半选状态", function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外', pid: 1},
                {id: 3, text: '国外', pid: 2},
                {id: 4, text: '国外', pid: 2}
            ];
            dataTree.load(mockData);
            dataTree.setValue(4);
            expect(dataTree.isHalf(1)).toBeTruthy();
        });
          
        it("测试载入数据后，判断是否可以把节点移动到父节点的情况", function() {
            dataTree.load(mockData);
            expect(dataTree.isMoveable(11, 2)).toBeTruthy();
        });
          
        it("测试载入数据后，判断是否可以把节点移动到子节点的情况", function() {
            dataTree.load(mockData);
            expect(dataTree.isMoveable(2, 11)).toBeFalsy();
        });
          
        it("测试载入数据后，判断是否可以把节点移动到兄弟节点的情况",
            function() {
            dataTree.load(mockData);
            expect(dataTree.isMoveable(2, 1)).toBeTruthy();
        });
          
        it("测试载入扁平数据结构后，判断创建索引关系数据的情况", function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外', pid: 1},
                {id: 3, text: '国外', pid: 2},
                {id: 4, text: '国外', pid: 2}
            ];
            dataTree.load(mockData);
            // 根节点的孩子节点
            expect(dataTree.indexRelation[DataTree.ROOT_KEY].child).toEqual([1]);
            // 节点1的孩子节点
            expect(dataTree.indexRelation['1'].child).toEqual([2]);
            // 节点1的父节点
            expect(dataTree.indexRelation['1'].pid).toEqual(null);
            // 节点2的孩子节点
            expect(dataTree.indexRelation['2'].child).toEqual([3, 4]);
            // 节点2的父节点
            expect(dataTree.indexRelation['2'].pid).toEqual(1);
            // 节点3的孩子节点
            expect(dataTree.indexRelation['3'].child).toEqual(undefined);
            // 节点3的父节点
            expect(dataTree.indexRelation['3'].pid).toEqual(2);
        });
          
        it("测试载入层级数据结构后，判断创建索引关系数据的情况", function() {
            var mockData = [
                {id: 1, text: '中国地区',
                    child:[
                       {id: 2, text: '国外',
                           child: [
                               {id: 3, text: '国外'},
                               {id: 4, text: '国外'}
                           ]
                       }
                   ]
                }
            ];
            dataTree.load(mockData);
            // 根节点的孩子节点
            expect(dataTree.indexRelation[DataTree.ROOT_KEY].child).toEqual([1]);
            // 节点1的孩子节点
            expect(dataTree.indexRelation['1'].child).toEqual([2]);
            // 节点1的父节点
            expect(dataTree.indexRelation['1'].pid).toEqual(null);
            // 节点2的孩子节点
            expect(dataTree.indexRelation['2'].child).toEqual([3, 4]);
            // 节点2的父节点
            expect(dataTree.indexRelation['2'].pid).toEqual(1);
            // 节点3的孩子节点
            expect(dataTree.indexRelation['3'].child).toEqual(undefined);
            // 节点3的父节点
            expect(dataTree.indexRelation['3'].pid).toEqual(2);
        });
          
        it("测试载入key有冲突的数据后，通过适配后解析的情况", function() {
            var mockData = [
                {uuid: 1, name: '中国地区'},
                {uuid: 2, name: '国外', parentId: 1},
                {uuid: 3, name: '国外', parentId: 2},
                {uuid: 4, name: '国外', parentId: 2}
            ];
            dataTree = new DataTree({
                mapKeys:{
                    id: 'uuid',
                    text: 'name',
                    pid: 'parentId'
                }
            });
            dataTree.load(mockData);
            expect(dataTree.indexRelation[DataTree.ROOT_KEY].child)
                .toEqual([1]);
            expect(dataTree.indexRelation[2].pid).toEqual(1);
            expect(dataTree.indexRelation[2].child).toEqual([3, 4]);
        });
          
        it("测试为数据创建索引的情况", function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            var data = dataTree.buildIndex(mockData);
            expect(data.indexRelation[DataTree.ROOT_KEY].child).toEqual([1]);
            expect(data.indexRelation[2].pid).toEqual(1);
            expect(data.indexRelation[2].child).toEqual([3, 4]);
              
            expect(data.indexData[1].text).toEqual('中国地区');
            expect(data.indexData[2].text).toEqual('国外2');
            expect(data.indexData[3].text).toEqual('国外3');
            expect(data.indexData[4].text).toEqual('国外4');
        });
          
        it("测试为数据清除索引的情况", function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            dataTree.load(mockData);
              
            dataTree.clearIndex();
            expect(dataTree.indexData[1]).toEqual(undefined);
            expect(dataTree.indexRelation[1]).toEqual(undefined);
        });
          
        it("测试为数据批量更新状态，设置为选中状态的情况", function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            dataTree.load(mockData);
              
            dataTree.updateAllStatus(DataTree.STATUS.checked);
            expect(dataTree.indexRelation[DataTree.ROOT_KEY].status)
                .toEqual(DataTree.STATUS.checked);
            expect(dataTree.indexRelation[1].status)
                .toEqual(DataTree.STATUS.checked);
            expect(dataTree.indexRelation[2].status)
                .toEqual(DataTree.STATUS.checked);
            expect(dataTree.indexRelation[3].status)
                .toEqual(DataTree.STATUS.checked);
            expect(dataTree.indexRelation[4].status)
                .toEqual(DataTree.STATUS.checked);
        });
    
        it("测试为数据批量更新状态，设置为半选状态的情况", function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            dataTree.load(mockData);
              
            dataTree.updateAllStatus(DataTree.STATUS.half);
            expect(dataTree.indexRelation[DataTree.ROOT_KEY].status)
                .toEqual(DataTree.STATUS.half);
            expect(dataTree.indexRelation[1].status)
                .toEqual(DataTree.STATUS.half);
            expect(dataTree.indexRelation[2].status)
                .toEqual(DataTree.STATUS.half);
            expect(dataTree.indexRelation[3].status)
                .toEqual(DataTree.STATUS.half);
            expect(dataTree.indexRelation[4].status)
                .toEqual(DataTree.STATUS.half);
        });
          
        it("测试为数据批量更新状态，设置为不选状态的情况", function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            dataTree.load(mockData);
              
            dataTree.updateAllStatus(DataTree.STATUS.unchecked);
            expect(dataTree.indexRelation[DataTree.ROOT_KEY].status)
                .toEqual(DataTree.STATUS.unchecked);
            expect(dataTree.indexRelation[1].status)
                .toEqual(DataTree.STATUS.unchecked);
            expect(dataTree.indexRelation[2].status)
                .toEqual(DataTree.STATUS.unchecked);
            expect(dataTree.indexRelation[3].status)
                .toEqual(DataTree.STATUS.unchecked);
            expect(dataTree.indexRelation[4].status)
                .toEqual(DataTree.STATUS.unchecked);
        });

        it("测试为数据设置值和测试获取数据的值，有1个以上兄弟节点的情况",
            function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            dataTree.load(mockData);

            dataTree.setValue(3);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent)).toEqual([3]);
        });

        it("测试为数据设置值和测试获取数据的值，没有兄弟节点的情况",
            function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            dataTree.load(mockData);
              
            dataTree.setValue(2);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([null]);
        });
          
        it("测试为数据设置值和测试获取数据的值，设置多个兄弟节点全部选中的情况",
            function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            dataTree.load(mockData);
            dataTree.setValue([3, 4]);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([null]);
        });
          
        it("测试为数据设置值和测试获取数据的值，不设置节点选中的情况",
            function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            dataTree.load(mockData);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([]);
        });
          
        it("测试为数据设置值和测试获取数据的值，设置不存在的节点的情况",
            function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            dataTree.load(mockData);
            dataTree.setValue([7]);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([]);
        });
          
        it("测试为数据设置值和测试获取数据的值，设置有存在和不存在的节点的情况",
            function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2}
            ];
            dataTree.load(mockData);
            dataTree.setValue([3, 7]);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([3]);
        });
          
        it("测试为数据追加值和测试获取数据的值，有1个以上兄弟节点的情况",
            function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2},
                {id: 5, text: '国外5', pid: 2},
                {id: 6, text: '国外6', pid: 2}
            ];
            dataTree.load(mockData);
            dataTree.addValue([3]);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([3]);
              
            // 继续追加值
            dataTree.addValue([4]);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([3, 4]);
              
            // 继续追加值
            dataTree.addValue([5]);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([3, 4, 5]);
              
            // 继续追加值，当兄弟节点全部选中后
            dataTree.addValue([6]);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([null]);
        });
          
        it("测试为数据追加值和测试获取数据的值，追加不存在的节点的情况",
            function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2},
                {id: 5, text: '国外5', pid: 2},
                {id: 6, text: '国外6', pid: 2}
            ];
            dataTree.load(mockData);
            dataTree.addValue([8]);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([]);
            // 继续追加已存在节点
            dataTree.addValue([1]);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([null]);
        });
          
        it("测试遍历指定节点的处理，不设置节点ID的情况", function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2},
                {id: 5, text: '国外5', pid: 2},
                {id: 6, text: '国外6', pid: 2}
            ];
            dataTree.load(mockData);
            var ids = [];
            dataTree.traverse(function (id, m, m1, level) {
                ids.push(id);
            });
            expect(ids).toEqual([null, 1, 2, 3, 4, 5, 6]);
        });

        it("测试遍历指定节点的处理，设置指定节点ID的情况", function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2},
                {id: 5, text: '国外5', pid: 2},
                {id: 6, text: '国外6', pid: 2}
            ];
            dataTree.load(mockData);
            var ids = [];
            dataTree.traverse(function (id) {
                ids.push(id);
            }, 2);
            expect(ids).toEqual([2, 3, 4, 5, 6]);
        });
          
        it("测试遍历指定节点的处理，设置不存在节点ID的情况", function() {
            var mockData = [
                {id: 1, text: '中国地区'},
                {id: 2, text: '国外2', pid: 1},
                {id: 3, text: '国外3', pid: 2},
                {id: 4, text: '国外4', pid: 2},
                {id: 5, text: '国外5', pid: 2},
                {id: 6, text: '国外6', pid: 2}
            ];
            dataTree.load(mockData);
            var ids = [];
            dataTree.traverse(function (id) {
                ids.push(id);
            }, 7);
            expect(ids).toEqual([]);
        });

        it("测试通过指定ID更新关系数据的数据状态，设置节点ID为选中的情况",
            function() {
            dataTree.load(mockData);
            dataTree.updateStatusById(3, DataTree.STATUS.checked);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([3]);
              
            // 判断父ID的当前状态
            expect(dataTree.indexRelation[1].status)
                .toEqual(DataTree.STATUS.half);
              
            // 判断子级ID的当前状态
            expect(dataTree.indexRelation[12].status)
                .toEqual(DataTree.STATUS.checked);
              
            // 判断兄弟ID的当前状态
            expect(dataTree.indexRelation[4].status)
                .toEqual(DataTree.STATUS.unchecked || undefined);
        });
          
        it("测试通过指定ID更新关系数据的数据状态，设置根节点为选中的情况",
            function() {
            dataTree.load(mockData);
              
            // 设置全选
            dataTree.updateAllStatus(DataTree.STATUS.checked);
              
            // 设置指定ID为不选
            dataTree.updateStatusById(3);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([4, 5, 6, 7, 8, 9, 10, 2]);
              
            // 判断子级ID的当前状态
            expect(dataTree.indexRelation[12].status)
                .toEqual(DataTree.STATUS.unchecked);
              
            // 判断兄弟ID的当前状态
            expect(dataTree.indexRelation[4].status)
                .toEqual(DataTree.STATUS.checked);
              
            // 判断父ID的当前状态
            expect(dataTree.indexRelation[1].status)
                .toEqual(DataTree.STATUS.half);
        });
          
        it("测试获取选中的数据，不进行下级选中数据的获取", function() {
            dataTree.load(mockData);
            dataTree.setValue(3);
            expect(dataTree.getValue(1)).toEqual([3]);
        });
    
        it("测试获取选中的数据，只获取叶子节点", function() {
            dataTree.load(mockData);
            dataTree.setValue(3);
            expect(dataTree.getValue(2)).toEqual([12, 13, 14, 15, 16]);
        });
          
        it("测试获取选中的数据，获取全部选中的节点", function() {
            dataTree.load(mockData);
            dataTree.setValue(3);
            expect(dataTree.getValue()).toEqual([3, 12, 13, 14, 15, 16]);
        });
          
        it("追加数据后，测试获取选中的数据，不进行下级选中数据的获取",
            function() {
            dataTree.load(mockData);
            dataTree.setValue(3);
            dataTree.addValue([4, 5]);
            expect(dataTree.getValue(1)).toEqual([3, 4, 5]);
        });
          
        it("更新数据后，测试获取选中的数据，不进行下级选中数据的获取",
            function() {
            dataTree.load(mockData);
            dataTree.setValue(3);
            dataTree.updateStatusById(4, DataTree.STATUS.checked);
            expect(dataTree.getValue(DataTree.VALUE_TYPE.onlyParent))
                .toEqual([3, 4]);
        });
          
        it("测试在已有的数据基础之上追加新的数据集，层级数据，"
            + "追加到根节点的情况", function() {
            dataTree.load(mockData);
            var newData = [
                {id: 27, text: '中国地区',
                    child:[
                        {id: 28, text: '国外',
                            child: [
                                {id: 29, text: '国外'},
                                {id: 30, text: '国外'}
                            ]
                        }
                    ]
                }
            ];
            dataTree.appendDataTo(newData);
            expect(dataTree.indexRelation[27].pid).toEqual(null);
              
            expect(dataTree.indexRelation[27].child).toEqual([28]);
              
            expect(dataTree.indexRelation[DataTree.ROOT_KEY].child)
                .toEqual([1, 2, 27]);
        });
    
        it("测试在已有的数据基础之上追加新的数据集，层级数据，"
            + "追加到指定节点的情况", function() {
            dataTree.load(mockData);
            var newData = [
                {id: 27, text: '中国地区',
                    child:[
                       {id: 28, text: '国外1',
                           child: [
                               {id: 29, text: '国外2'},
                               {id: 30, text: '国外3'}
                           ]
                       }
                   ]
                }
            ];
            dataTree.appendDataTo(newData, 5);
            expect(dataTree.indexRelation[27].pid).toEqual(5);
            expect(dataTree.indexRelation[27].child).toEqual([28]);
            
            expect(dataTree.indexRelation[5].child)
                .toEqual([17, 18, 19, 20, 21, 27]);
              
            expect(dataTree.indexData[27].text).toEqual('中国地区');
            expect(dataTree.indexData[28].text).toEqual('国外1');
            expect(dataTree.indexData[29].text).toEqual('国外2');
            expect(dataTree.indexData[30].text).toEqual('国外3');
        });
          
        it("测试在已有的数据基础之上追加新的数据集，扁平数据，"
            + "追加到根节点的情况", function() {
            dataTree.load(mockData);
            var newData = [
                {id: 27, text: '中国地区'},
                {id: 28, text: '国外2'},
                {id: 29, text: '国外3'},
                {id: 30, text: '国外4'},
                {id: 31, text: '国外5'},
                {id: 32, text: '国外6'}
            ];
            dataTree.appendDataTo(newData);
            expect(dataTree.indexRelation[27].pid).toEqual(null);
            expect(dataTree.indexRelation[27].child).toEqual(undefined);
            
            expect(dataTree.indexRelation[DataTree.ROOT_KEY].child)
                .toEqual([1, 2, 27, 28, 29, 30, 31, 32]);
        });
          
        it("测试在已有的数据基础之上追加新的数据集，扁平数据，"
            + "追加到指定节点的情况", function() {
            dataTree.load(mockData);
            var newData = [
                {id: 27, text: '中国地区'},
                {id: 28, text: '国外2'},
                {id: 29, text: '国外3'},
                {id: 30, text: '国外4'},
                {id: 31, text: '国外5'},
                {id: 32, text: '国外6'}
            ];
            dataTree.appendDataTo(newData, 26);
            expect(dataTree.indexRelation[27].pid).toEqual(26);
            expect(dataTree.indexRelation[27].child).toEqual(undefined);
            
            expect(dataTree.indexRelation[26].child)
                .toEqual([27, 28, 29, 30, 31, 32]);
        });
          
        it("测试在已有的数据基础之上追加新的数据集，扁平数据，"
            + "追加到多个指定节点的情况", function() {
            dataTree.load(mockData);
            var newData = [
                {id: 27, text: '中国地区'},
                {id: 28, text: '国外2', pid: 3},
                {id: 29, text: '国外3', pid: 27},
                {id: 30, text: '国外4', pid: 5},
                {id: 31, text: '国外5', pid: 32},
                {id: 32, text: '国外6', pid: 1}
            ];
            dataTree.appendDataTo(newData, 1);
            expect(dataTree.indexRelation[27].pid).toEqual(1);
            expect(dataTree.indexRelation[27].child).toEqual([29]);
            
            expect(dataTree.indexRelation[28].pid)
                .toEqual(3);
          
            expect(dataTree.indexRelation[28].child)
                .toEqual(undefined);
              
            expect(dataTree.indexRelation[29].pid)
                .toEqual(27);

            expect(dataTree.indexRelation[29].child)
                .toEqual(undefined);
              
            expect(dataTree.indexRelation[30].pid)
                .toEqual(5);
    
            expect(dataTree.indexRelation[30].child)
                .toEqual(undefined);
              
            expect(dataTree.indexRelation[31].pid)
                .toEqual(32);
    
            expect(dataTree.indexRelation[31].child)
                .toEqual(undefined);
              
            expect(dataTree.indexRelation[32].pid)
                .toEqual(1);
    
            expect(dataTree.indexRelation[32].child)
                .toEqual([31]);
    
            expect(dataTree.indexRelation[1].child)
                .toEqual([3, 4, 5, 6, 7, 8, 9, 10, 27, 32]);
              
            expect(dataTree.indexData[27].text).toEqual('中国地区');
            expect(dataTree.indexData[28].text).toEqual('国外2');
            expect(dataTree.indexData[29].text).toEqual('国外3');
            expect(dataTree.indexData[30].text).toEqual('国外4');
            expect(dataTree.indexData[31].text).toEqual('国外5');
            expect(dataTree.indexData[32].text).toEqual('国外6');
        });

        it("测试在已有的数据基础删除某个节点数据，删除叶子的情况",
            function() {
            dataTree.load(mockData);
            dataTree.remove(22);
            expect(dataTree.indexRelation[22]).toEqual(undefined);
            expect(dataTree.indexData[22]).toEqual(undefined);
        });

        it("测试在已有的数据基础删除某个节点数据，删除非叶子的情况",
            function() {
            dataTree.load(mockData);
            dataTree.remove(18);
            expect(dataTree.indexRelation[18]).toEqual(undefined);
            expect(dataTree.indexData[18]).toEqual(undefined);
            expect(dataTree.indexRelation[22]).toEqual(undefined);
            expect(dataTree.indexData[22]).toEqual(undefined);
        });
          
        it("测试在已有的数据基础删除某个节点数据，删除根节点的情况",
            function() {
            dataTree.load(mockData);
            dataTree.remove(DataTree.ROOT_KEY);
            expect(dataTree.indexRelation[DataTree.ROOT_KEY])
                .toEqual(undefined);
            expect(dataTree.indexData[DataTree.ROOT_KEY]).toEqual(undefined);
            expect(dataTree.indexRelation[1]).toEqual(undefined);
            expect(dataTree.indexData[1]).toEqual(undefined);
            expect(dataTree.indexRelation[2]).toEqual(undefined);
            expect(dataTree.indexData[2]).toEqual(undefined);
            expect(dataTree.indexRelation[18]).toEqual(undefined);
            expect(dataTree.indexData[18]).toEqual(undefined);
            expect(dataTree.indexRelation[22]).toEqual(undefined);
            expect(dataTree.indexData[22]).toEqual(undefined);
        });
          
        it("测试节点间的移动，把节点移动到子节点的情况", function() {
            dataTree.load(mockData);
            dataTree.moveTo(18, 22);
            expect(dataTree.indexRelation[18].child).toContain(22);
        });

        it("测试节点间的移动，把节点移动到祖先节点的情况", function() {
            dataTree.load(mockData);
            dataTree.moveTo(18, 1);
            expect(dataTree.indexRelation[18].child).toContain(22);
            expect(dataTree.indexRelation[18].pid).toEqual(1);
            
            expect(dataTree.indexRelation[5].child).toEqual([17, 19, 20, 21]);
            
            expect(dataTree.indexRelation[1].child).toContain(18);
        });

        it("测试节点间的移动，把节点移动到祖先节点的情况", function() {
            dataTree.load(mockData);
            dataTree.moveTo(18, 1);
            expect(dataTree.indexRelation[18].child).toContain(22);
            expect(dataTree.indexRelation[18].pid).toEqual(1);

            expect(dataTree.indexRelation[5].child).toEqual([17, 19, 20, 21]);

            expect(dataTree.indexRelation[1].child).toContain(18);
        });
    });
})
