/**
 * @file 带层级关系的数据的分析
 * 提供一套针对有层级关系和状态的Dom层级展示进行抽象到数据层面进行分析的处理
 * 实现，主要包括以下功能：
 * 1：数据处理
 *      1）对扁平、层级数据统一解析
 *      2）为数据建立索引并根据此索引进行各种处理
 *      3）清除索引数据
 *      3）为数据提供适配处理
 * 2：状态设置
 *      1）包括批量更新数据的状态（对应全选、全取消）
 *      2）更新指定节点状态（对应选中或取消某个节点）
 *      3）设置值、获取值（对应初始化设置和提交时数据获取）
 *      4）
 * 3：数据移动
 *      1）把数据追加到指定位置（异步加载下级数据）
 *      2）把指定节点数据移除（删除指定节点）
 *      3）把指定节点数据迁移到另一个位置（拖拽节点到另一个节点下）
 * 
 * @author Zhang Shaolong(zhangshaolong@baidu.com)
 */
var DataTree = function () {

    // 在索引关系数据的时候，key为null的索引为树根数据
    var ROOT_KEY = 'null';

    // 减少查找次数，提高效率
    var toString = Object.prototype.toString;

    // 提出来是为减少创建次数
    var ARRAY_TYPE = '[object Array]';

    // 默认的父ID的key为pid，本级ID的key为id，下级的key为child
    var DEFAULT_MAP_KEYS = {
        pid: 'pid',
        id: 'id',
        child: 'child'
    };

    // 支持关系数的3种状态，可对应树型展示时的不选，半选和选中状态
    var STATUS = {
        'unchecked': 0,
        'checked': 1,
        'half': 2
    };

    /**
     * 为load的数据进行key的适配
     * @param {?Object} mapKeys 要适配的key对应关系
     * @param {DataTree} dataTree 当前DataTree实例
     */
    var setMapKeys = function (mapKeys, dataTree) {
        var mks = dataTree.mapKeys = {};
        each(DEFAULT_MAP_KEYS, function (val, key) {
            mks[key] = mapKeys && mapKeys[key] || val;
        });
    };

    var isArray = function (target) {
        return toString.call(target) === ARRAY_TYPE;
    };

    /**
     * 封装的for循环，支持对数组和Object类型的遍历
     * @param {Array|Object} arr 数组或Object类型
     * @param {Function} fun 要处理的任务
     *      fun接收两个参数，第一个为遍历的value，第二个为index或者key
     */
    var each = function (arr, fun) {
        if (arr) {
            var len = arr.length;
            if (isArray(arr)) {
                for(var idx = 0; idx < len;) if (fun.call(arr[idx],
                    arr[idx], idx++) === false) {
                    break;
                }
            } else if (arr.constructor === Object) {
                for (var idx in arr) if (fun.call(arr[idx],
                    arr[idx], idx) === false) {
                    break;
                }
            }
        }
    };

    /**
     * 扁平的数据分析函数
     * @param {Array.<Object>} data 需要分析的数据集合
     * @param {Object} 适配器记录的key转换关系
     * @param {?Object} indexData 分析得出的数据索引
     * @param {?Object} indexRelation 分析得出的关系索引
     * @returns {Object}
     */
    var flatDataProcess = function (data, mapKeys, indexData, indexRelation) {
        var idKey = mapKeys.id;
        var pidKey = mapKeys.pid;
        var childKey = mapKeys.child;
        indexData = indexData || {};
        indexRelation = indexRelation || {};
        each(data, function (model, i) {
            var id = model[idKey];
            var pid = model[pidKey] === undefined ? null : model[pidKey];
            var relationMap = indexRelation[id] = {};
            var dataInfo = indexData[id] = {};
            each(model, function (val, key) {
                if (childKey !== key && pidKey !== key) {
                    dataInfo[key] = val;
                }
            });
            relationMap[pidKey] = pid;
            var pidMap = indexRelation[pid];
            if (!pidMap) {
                pidMap = indexRelation[pid] = {};
            }
            var pChilds = pidMap[childKey];
            if (!pChilds) {
                pChilds = pidMap[childKey] = [];
            }
            pChilds.push(id);
        });
        return {
            indexData: indexData,
            indexRelation: indexRelation
        }
    };
    
    /**
     * 层级的数据分析函数
     * @param {Array.<Object>} data 需要分析的数据集合
     * @param {Object} 适配器记录的key转换关系
     * @param {?Object} indexData 分析得出的数据索引
     * @param {?Object} indexRelation 分析得出的关系索引
     * @param {?string} pid 上级节点ID
     * @param {?Array.<string>} child4pid 放置上级节点子级的数组
     * @returns {Object}
     */
    var levelDataProcess = function (data, mapKeys, indexData, indexRelation,
        pid, child4pid) {
        var idKey = mapKeys.id;
        var pidKey = mapKeys.pid;
        var childKey = mapKeys.child;
        pid = pid === undefined ? null : pid;
        indexData = indexData || {};
        indexRelation = indexRelation || {};
        // 添加第一级数据关系，即把pid为null的数据放入到key为ROOT_KEY的child字段上
        if (null === pid) {
            var relationMap = indexRelation[ROOT_KEY] = {};
            child4pid = relationMap[childKey] = [];
        }
        each(data, function (model, i) {
            var id = model[idKey];
            child4pid && child4pid.push(id);
            var childs = model[childKey];
            var relationMap = indexRelation[id] = {};
            var dataInfo = indexData[id] = {};
            each(model, function (val, key) {
                if (childKey !== key && pidKey !== key) {
                    dataInfo[key] = val;
                }
            })
            relationMap.pid = pid;
            if (childs) {
                var child4id = relationMap.child = [];
                levelDataProcess(childs, mapKeys, indexData, indexRelation,
                    id, child4id);
            }
        });
        return {
            indexData: indexData,
            indexRelation: indexRelation
        };
    };
    
    /**
     * @constructor
     * 
     */
    var DataTree = function (option) {
        option = option || {}；
        this.indexData = {};
        this.indexRelation = {};
        setMapKeys(option.mapKeys, this);
    };
    
    /**
     * 数据是否是扁平结构
     */
    DataTree.prototype.isFlat = function (data) {
        var isFlat = true;
        var childKey = this.mapKeys.child;
        each(data, function (model) {
            if (model[childKey] !== undefined) {
                return isFlat = false;
            }
        })
        return isFlat;
    };
    
    /**
     * 当前节点下是否有选中状态的下级节点
     * @returns {boolean}
     */
    DataTree.prototype.isHalf = function (id) {
        var child = this.indexRelation[id].child;
        if (child) {
            var len = child.length;
            var status = child[0]._status;
            if (len >= 1) {
                for (var i=1; i<len; i++) {
                    if (this.indexRelation[child[i]]._status != status) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    
    /**
     * 判断两个节点是否是父子关系，用于移动节点时的check
     * @param {string} 被移动的节点ID
     * @param {string} 移动到的目标节点ID
     * @returns {boolean} 被移动节点是否为目标节点的子孙
     */
    DataTree.prototype.isChilds = function (id, targetId) {
        var indexRelation = this.indexRelation;
        var isChild = false;
        var isContains = function (id, targetId) {
            var child = indexRelation[id].child;
            if (child) {
                each(child, function (id) {
                    if (id === targetId) {
                        return !isChild = true;
                    }
                    isContains(id, targetId);
                });
            }
        };
        isContains(id, targetId);
        return isChild;
    };
    
    /**
     * 是否可以进行节点的移动
     * @param {string} 被移动的节点ID
     * @param {string} 移动到的目标节点ID
     * @returns {boolean} 是否可移动
     */
    DataTree.prototype.moveAble = function (id, targetId) {
        var indexRelation = this.indexRelation;
        if (id === targetId) {
            return false;
        }
        if (!indexRelation[id] || !indexRelation[targetId]) {
            return false;
        }
        return !this.isChilds(id, targetId);
    };
    
    /**
     * 数据加载器，加载后，自动解析为带索引的数据进行存储
     */
    DataTree.prototype.load = function (data) {
        if (data) {
            this.clearIndex();
            var indexResult = this.buildIndex(data);
            this.indexData = indexResult.indexData;
            this.indexRelation = indexResult.indexRelation;
        }
    };

    DataTree.prototype.flatDataProcess = function (data) {
        return flatDataProcess(data, this.mapKeys);
    };

    DataTree.prototype.levelDataProcess = function (data) {
        return levelDataProcess(data, this.mapKeys);
    };

    /**
     * 生成索引数据，为数据分析提供支持
     * @param {Array.<Obejct>} data 数据集
     */
    DataTree.prototype.buildIndex = function (data) {
        return this.isFlat(data)
            ? this.flatDataProcess(data)
            : this.levelDataProcess(data);
    };

    /**
     * 清除索引数据，会丢弃之前的索引数据
     */
    DataTree.prototype.clearIndex = function () {
        this.indexData = {};
        this.indexRelation = {};
    };

    /**
     * 批量更新数据的状态
     * @param {boolean} status 被更新到的状态，只能是选中和不选
     */
    DataTree.prototype.updateAll = function (status) {
        var indexRelation = this.indexRelation;
        each(indexRelation, function (model) {
            model._status = status;
        })
    };
    
    /**
     * 在原有选中基础上进行增量添加
     * @param {Array.<string>} ids 被批量增加的节点ID集合
     */
    DataTree.prototype.addValue = function (ids) {
        ids = [].concat(ids);
        var me = this;
        each(ids, function (id) {
            me.updateById(id, STATUS.checked);
        });
    };
    
    /**
     * 重新设置数据的选中数据，与addValue不同，会清空之前选中的值
     * @param {Array.<string>} ids 被设置选中的节点ID集合
     */
    DataTree.prototype.setValue = function (ids) {
        this.updateAll(false);
        this.addValue(ids);
    };
    
    /**
     * 获取所有选中节点的ID集合
     * @param {?boolean} onlyLeaf 是否只获取选中叶子节点的ID
     */
    DataTree.prototype.getValue = function (onlyLeaf) {
        var indexData = this.indexData;
        var indexRelation = this.indexRelation;
        var selected = [];
        each(indexData, function (model, key) {
            if (indexRelation[key]._status === STATUS.checked) {
                if (onlyLeaf) {
                    if (!indexRelation[key].child) {
                        selected.push(key);
                    }
                } else {
                    selected.push(key);
                }
            }
        })
        return selected;
    };
    
    /**
     * 通过指定ID更新关系数据的数据状态
     * @param {string} id 节点ID
     * @param {boolean} status 节点状态
     */
    DataTree.prototype.updateById = function (id, status) {
        var indexRelation = this.indexRelation;
        var model = indexRelation[id];
        model._status = status = (status == STATUS.checked) ? STATUS.checked
            : STATUS.unchecked;
        this.updateChilds(model.child, status);
        this.updateParents(model.pid, status);
    };
    
    /**
     * 更新指定节点的所有父级节点的状态
     * @param {string} id 节点ID
     * @param {boolean} status 节点状态
     */
    DataTree.prototype.updateParents = function (id, status) {
        if (id !== undefined && id !== null) {
            var indexRelation = this.indexRelation;
            if (status === STATUS.half || this.isHalf(id)) {
                status = STATUS.half;
            }
            indexRelation[id]._status = status;
            this.updateParents(indexRelation[id].pid, status);
        }
    };
    
    /**
     * 更新指定节点的所有子级节点的状态
     * @param {string} id 节点ID
     * @param {boolean} status 节点状态
     */
    DataTree.prototype.updateChilds = function (ids, status) {
        if (ids) {
            var indexRelation = this.indexRelation;
            var me = this;
            each(ids, function (id) {
                var relationModel = indexRelation[id];
                relationModel._status = status;
                me.updateChilds(relationModel.child, status);
            })
        }
    };
    
    /**
     * 把数据添加到指定节点上
     *     如果是扁平数据结构，可以通过data中的pid自动追加到已存在的pid数据
     *     的child上，所以扁平数据中的targetId可能有多个。
     * @param {Array.<Object>} data 被添加的数据
     * @param {string} targetId 被添加到的节点ID
     */
    DataTree.prototype.append = function (data, targetId) {
        if (data) {
            var targets = [];
            var targetIndexData = this.indexData;
            var targetIndexRelation = this.indexRelation;
            targetId = targetId === undefined ? null : targetId;
            var indexResult = this.buildIndex(data);
            var indexRelation = indexResult.indexRelation;
            var targetModel = targetIndexRelation[targetId];
            if (targetModel) {
                if (this.isFlat(data)) {
                    var parents = {};
                    var nullParentMap = {};
                    var nulls = indexRelation[ROOT_KEY].child;
                    if (nulls) {
                        var targetChild = targetIndexRelation[targetId].child;
                        if (!targetChild) {
                            targetChild = [];
                            targetIndexRelation[targetId].child = targetChild;
                        }
                        each(nulls, function (id) {
                            nullParentMap[id] = 1;
                            indexRelation[id].pid = targetId;
                            targetChild.push(id);
                        })
                        delete indexRelation[ROOT_KEY];
                        targets.push(targetId);
                    }
                    each(indexRelation, function (model, key) {
                        if (model.pid === null
                            || model.pid === undefined) {
                            if (!nullParentMap[key]) {
                                parents[key] = model.child;
                                targets.push(key);
                            }
                        }
                    });
                    each(parents, function (ids, key) {
                        var targetChild = targetIndexRelation[key].child;
                        if (!targetChild) {
                            targetChild = targetIndexRelation[key].child = [];
                        }
                        each(ids, function (id) {
                            targetChild.push(id);
                        });
                    });
                } else {
                    var headIndexRelation = indexResult.indexRelation[ROOT_KEY];
                    if (headIndexRelation) {
                        var child = headIndexRelation.child;
                        if (child) {
                            var targetChild = targetModel.child;
                            if (!targetChild) {
                                targetChild = targetModel.child = [];
                            }
                            each(child, function (id) {
                                targetChild.push(id);
                                indexResult.indexRelation[id].pid = targetId;
                            });
                            targets.push(targetId);
                        }
                    }
                }
            }
            each(indexResult.indexData, function (model, key) {
                if (!targetIndexData[key]) {
                    targetIndexData[key] = model;
                } else {
                    throw '添加的数据中有已经存在的节点';
                }
            });
            each(indexResult.indexRelation, function (model, key) {
                if (!targetIndexRelation[key]) {
                    targetIndexRelation[key] = model;
                } else {
                    console.log(key)
                }
            });
        }
        return targets;
    };
    
    /**
     * 删除指定节点数据
     * @param {string} id 被删除的节点ID，他下面的所有数据一起被移除
     * @param {?boolean} ignoreIndex 是否移除父级对此id的索引，
     *      自动处理，不需要传
     */
    DataTree.prototype.remove = function (id, ignoreIndex) {
        var me = this;
        id = id === undefined ? null : id;
        var indexRelation = this.indexRelation;
        var indexModel = indexRelation[id];
        if (indexModel) {
            delete indexRelation[id];
            delete this.indexData[id];
            if (!ignoreIndex) {
                var pid = indexModel.pid;
                if (pid !== undefined) {
                    each(indexRelation[pid].child, function (sibling, i) {
                        if (sibling === id) {
                            indexRelation[pid].child.splice(i, 1);
                            return false;
                        }
                    });
                }
            }
            each(indexModel.child, function (id, i) {
                delete me.indexData[id];
                me.remove(id, true);
            })
        }
    };
    
    /**
     * 把指定节点移动到另外节点上
     * @param {string} id 被移动的节点ID
     * @param {string} targetId 被移动到的目标节点ID
     */
    DataTree.prototype.moveTo = function (id, targetId) {
        var me = this;
        var indexRelation = this.indexRelation;
        targetId = targetId === undefined ? null : targetId;
        if (this.moveAble(id, targetId)) {
            var siblings = indexRelation[indexRelation[id].pid].child;
            each(siblings, function (sibling, i) {
                if (sibling === id) {
                    siblings.splice(i, 1);
                    indexRelation[id].pid = targetId;
                    var targetModel = indexRelation[targetId];
                    var targetChild = targetModel.child;
                    if (!targetChild) {
                        targetChild = targetModel.child = [];
                    }
                    targetChild.push(id);
                    me.updateParents(targetId, targetModel._status || false);
                    return false;
                }
            })
        } else {
            console.log('不能将节点：' + id + '移动到节点：' + targetId + '下');
        }
    };
    return DataTree;
}();